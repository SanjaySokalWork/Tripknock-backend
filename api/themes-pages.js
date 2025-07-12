const express = require("express");
const router = express.Router();
const ThemesPages = require("../tables/themes-pages");
const themesPages = new ThemesPages();
const Theme = require("../tables/theme");
const theme = new Theme();
const User = require("../tables/user");
const user = new User();
const Combined = require("../tables/combined");
const combined = new Combined();
const Image = require("../tables/image");
const image = new Image();
const Package = require("../tables/package");
const package = new Package();
const Destination = require("../tables/destination");
const destination = new Destination();
const Include = require("../tables/include");
const include = new Include();

router.get("/all", async (req, resp) => {
    try {
        let data = await themesPages.findAll();
        if (!data) return resp.status(404).send({ status: false, message: "No theme pages found" });

        let sendData = [];

        for (let i = 0; i < data.length; i++) {
            let img = JSON.parse(data[i].images);
            let imagesData = [];

            for (let j = 0; j < img.length; j++) {
                imagesData.push((await image.findById(img[j])).file_path);
            }
            let meta = JSON.parse((await combined.findById(data[i].meta))[0].data);
            let popularDestinations = JSON.parse((await combined.findById(data[i].popularDestinations))[0].data);
            let mainPackages = JSON.parse((await combined.findById(data[i].mainPackages))[0].data);
            let faqs = JSON.parse((await combined.findById(data[i].faqs))[0].data);
            let title = JSON.parse(data[i].type).name;
            let fromDestination = JSON.parse(data[i].type).from;
            let type = JSON.parse(data[i].type);
            let category = JSON.parse(data[i].type).category;

            sendData.push({
                id: data[i].id,
                name: data[i].name,
                slug: data[i].slug,
                title: title,
                from: fromDestination,
                category: category,
                type: type,
                description: data[i].description,
                status: data[i].status,
                longDescription: data[i].longDescription,
                date: data[i].date,
                images: imagesData,
                meta: meta,
                popularDestinations: popularDestinations,
                mainPackages: mainPackages,
                faqs: faqs
            });
        }
        return resp.send(sendData);
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/load", async (req, resp) => {
    let packages = await package.findAll();
    let destinations = await destination.findAll();
    let destinationsData = [];
    for (let i = 0; i < destinations.length; i++) {
        let type = JSON.parse(destinations[i].type);
        if (type.category === '' && type.from === '') {
            destinationsData.push(destinations[i]);
        }
    }
    resp.send({ packages: packages, destinations: destinationsData });
})

router.post("/create", async (req, resp) => {
    let { admin } = req.headers;
    let { status, meta, fromDestination, name, category, title, slug, description, popularDestinations, mainPackages, longDescription, faqs } = JSON.parse(req.body.data);

    // Normalize images to array format (express-fileupload sends single file as object, multiple as array)
    let imageFiles = [];
    if (req.files && req.files.images) {
        if (Array.isArray(req.files.images)) {
            imageFiles = req.files.images;
        } else {
            imageFiles = [req.files.images]; // Single file case
        }
    }

    // Validate image count
    if (imageFiles.length > 3) {
        return resp.status(400).send({ status: false, message: "Maximum 3 images allowed" });
    }

    // If name is not provided, derive it from title
    if (!name && title) {
        name = title;
    }

    if (!status || !meta || !title || !slug || !description) {
        return resp.status(400).send({ status: false, message: "Missing required fields" });
    }

    // Auto-set to draft if missing critical data or no images for published status
    if (!status || !meta || !title || !description || !popularDestinations || !mainPackages || !longDescription || !faqs) {
        status = "draft";
    }

    // For published theme pages, require at least one image
    if (status === 'published' && imageFiles.length === 0) {
        return resp.status(400).send({ status: false, message: "At least one image is required for published theme pages" });
    }

    if (!(await user.isRole(admin, ["admin", "subadmin"]))) return resp.status(401).send({ status: false, message: "Access Denied!" });

    if (await themesPages.existsBySlug(slug)) return resp.send({ status: false, message: "Theme page already exists" });

    let type = {}
    let data = {};

    type.name = name;
    type.from = fromDestination;
    type.category = category;
    if (await themesPages.exists({ type: JSON.stringify(type) })) return resp.send({ status: false, message: "Theme page already exists" });

    data.name = name;
    data.type = JSON.stringify(type);
    data.meta = (await combined.create({ type: "meta", data: meta })).insertId;
    data.title = title;
    data.slug = slug;
    data.description = description;
    data.popularDestinations = (await combined.create({ type: "popularDestinations", data: JSON.stringify(popularDestinations) })).insertId;
    data.mainPackages = (await combined.create({ type: "mainPackages", data: JSON.stringify(mainPackages) })).insertId;
    data.longDescription = longDescription;
    data.faqs = (await combined.create({ type: "faqs", data: faqs })).insertId;
    data.status = status;

    let img = [];
    try {
        if (imageFiles.length > 0) {
            for (let i = 0; i < imageFiles.length; i++) {
                const imageResult = await image.convertAndUpload(imageFiles[i], "themes-pages");
                if (imageResult && imageResult.insertId) {
                    img.push(imageResult.insertId);
                } else {
                    throw new Error(`Failed to upload image ${i + 1}`);
                }
            }
        }
    } catch (error) {
        console.log("Error processing images:", error);
        return resp.status(500).send({ status: false, message: `Image processing failed: ${error.message}` });
    }

    data.images = JSON.stringify(img);

    if (await themesPages.create(data)) {
        return resp.send({ status: true, message: "Theme page created successfully" });
    }

    return resp.send({ status: false, message: "Something went wrong" });
})

router.post("/validate", async (req, resp) => {
    let { slug } = req.body;
    if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });
    if (await themesPages.existsBySlug(slug)) {
        return resp.send({ status: false, message: "Slug already exists" });
    }
    return resp.send({ status: true, message: "Slug available" });
})

router.post("/validate-theme", async (req, resp) => {
    let data = req.body;
    if (!data) return resp.status(400).send({ status: false, message: "Bad Request" });

    let allThemes = await themesPages.findAll();

    for (let i = 0; i < allThemes.length; i++) {
        let currentTheme = JSON.parse(allThemes[i].type);
        if (currentTheme.from === data.from && currentTheme.category === data.category) {
            return resp.send({ status: false, message: "Theme page already exists" });
        }
    }

    return resp.send({ status: true, message: "Theme page available" });
})

router.post("/delete", async (req, resp) => {
    let { admin } = req.headers;
    const { id } = req.body;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });
    if (!id) return resp.status(500).send({ status: false, message: "Internal Server Error" });
    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            if (await themesPages.delete({ id: id })) {
                return resp.send({ status: true, message: "Theme page deleted successfully" });
            }
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in /delete route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

// Helper function to get packages with category support
const getPackages = async (dname) => {
    if (!dname) return { status: false, message: "Bad Request" };

    try {
        let allDestinationsData = await destination.findAll();

        let allPackagesData = await package.findAll();

        let allDestinationsIds = [];

        let finalPackagesData = [];
        for (let i = 0; i < allDestinationsData.length; i++) {
            let destinationType = JSON.parse(allDestinationsData[i].type);
            if (destinationType.name === dname) {
                if (destinationType.category === '' || destinationType.category === null) {
                    allDestinationsIds.push(allDestinationsData[i].id);
                }
            }
        }

        for (let j = 0; j < allDestinationsIds.length; j++) {
            for (let k = 0; k < allPackagesData.length; k++) {
                let packageDestinations = JSON.parse((await combined.findById(allPackagesData[k].destinations))[0].data);
                if (packageDestinations.includes(String(allDestinationsIds[j])) || packageDestinations.includes(allDestinationsIds[j])) {
                    finalPackagesData.push(allPackagesData[k]);
                }
            }
        }

        return {
            status: true,
            data: finalPackagesData,
            totalPackages: finalPackagesData.length,
        };
    } catch (error) {
        console.log("Error in getPackagesCategory function:", error);
        return { status: false, message: "Internal Server Error" };
    }
}

const getPackagesCategory = async (dname, cname) => {
    if (!dname) return { status: false, message: "Bad Request" };

    let isNotCategory = !cname || cname === '' || cname === null;

    try {
        let allDestinationsData = await destination.findAll();

        let allPackagesData = await package.findAll();

        let allDestinationsIds = [];

        let finalPackagesData = [];

        if (isNotCategory) {
            for (let i = 0; i < allDestinationsData.length; i++) {
                let destinationType = JSON.parse(allDestinationsData[i].type);
                if (destinationType.name === dname) {
                    if (destinationType.category === '' || destinationType.category === null) {
                        // console.log("========================");
                        // console.log(allDestinationsData[i].id);
                        // console.log(JSON.parse(allDestinationsData[i].type));
                        allDestinationsIds.push(allDestinationsData[i].id);
                    }
                }
                // if (destinationType.name.toLowerCase() === dname.toLowerCase() && destinationType.category.toLowerCase() === cname.toLowerCase()) {
                //     // matchingDestinations.push(allDestinationsData[i]);
                //     console.log(destinationType);
                // }
            }

            for (let j = 0; j < allDestinationsIds.length; j++) {
                for (let k = 0; k < allPackagesData.length; k++) {
                    let packageDestinations = JSON.parse((await combined.findById(allPackagesData[k].destinations))[0].data);
                    if (packageDestinations.includes(String(allDestinationsIds[j])) || packageDestinations.includes(allDestinationsIds[j])) {
                        finalPackagesData.push(allPackagesData[k]);
                    }
                }
            }
        } else {
            for (let i = 0; i < allDestinationsData.length; i++) {
                let destinationType = JSON.parse(allDestinationsData[i].type);
                if (destinationType.name === dname) {
                    allDestinationsIds.push(allDestinationsData[i].id);
                }
            }

            for (let j = 0; j < allDestinationsIds.length; j++) {
                for (let k = 0; k < allPackagesData.length; k++) {
                    let packageDestinations = JSON.parse((await combined.findById(allPackagesData[k].destinations))[0].data);
                    if (packageDestinations.includes(String(allDestinationsIds[j])) || packageDestinations.includes(allDestinationsIds[j])) {

                        let categorySlug = JSON.parse((await combined.findAllWhere({ id: allPackagesData[k].themes }))[0].data);

                        for (let l = 0; l < categorySlug.length; l++) {
                            let currentTheme = (await theme.find({ slug: categorySlug[l] }))[0];

                            if (currentTheme.name === cname) {
                                finalPackagesData.push(allPackagesData[k]);
                            }
                        }
                    }
                }
            }
        }

        return {
            status: true,
            data: finalPackagesData,
            totalPackages: finalPackagesData.length,
        };
    } catch (error) {
        console.log("Error in getPackagesCategory function:", error);
        return { status: false, message: "Internal Server Error" };
    }
}

// Helper function to get full package details
const getFullPackageDetails = async (packageData) => {
    try {
        let fullPackage = { ...packageData };

        // Get time data
        let timeData = JSON.parse((await combined.findById(fullPackage.time))[0].data);
        fullPackage.days = timeData.days;
        fullPackage.nights = timeData.nights;

        // Get meta data
        let metaData = JSON.parse((await combined.findById(fullPackage.meta))[0].data);
        fullPackage.metaTitle = metaData.title;
        fullPackage.metaTags = metaData.tags;

        // Get pricing data
        let priceData = JSON.parse((await combined.findById(fullPackage.price))[0].data);
        fullPackage.pricing = {
            deluxe: priceData[0],
            luxury: priceData[1],
            premium: priceData[2]
        };

        // Get images
        let imageIds = JSON.parse(fullPackage.images);
        let images = [];
        for (let k = 0; k < imageIds.length; k++) {
            let img = await image.findById(imageIds[k]);
            if (img) {
                images.push(img.file_path);
            }
        }
        fullPackage.images = images;

        // Get destination details
        let packageDestinations = JSON.parse((await combined.findById(fullPackage.destinations))[0].data);
        let destinationDetails = [];
        for (let k = 0; k < packageDestinations.length; k++) {
            let destResult = await destination.findAllWhere({ id: packageDestinations[k] });
            if (destResult && destResult[0]) {
                destinationDetails.push(destResult[0]);
            }
        }
        fullPackage.destinations = destinationDetails;

        // Get includes data
        let includesData = JSON.parse((await combined.findById(fullPackage.includes))[0].data);
        let includes = [];
        for (let k = 0; k < includesData.length; k++) {
            let includeResult = await include.query(`SELECT include.name, image.file_path, include.id FROM include INNER JOIN image ON include.image = image.id WHERE include.name = '${includesData[k]}'`);
            if (includeResult && includeResult[0]) {
                includes.push(includeResult[0]);
            }
        }
        fullPackage.includes = includes;

        // Get journey data
        let journeyData = JSON.parse((await combined.findById(fullPackage.journey))[0].data);
        fullPackage.journey = journeyData;
        // console.log(fullPackage.journey);

        // Get itinerary data
        let itineraryData = JSON.parse((await combined.findById(fullPackage.itinerary))[0].data);
        fullPackage.itinerary = itineraryData;

        // Get inclusions data
        let inclusionsData = JSON.parse((await combined.findById(fullPackage.inclusions))[0].data);
        fullPackage.inclusions = inclusionsData;

        // Get exclusions data
        let exclusionsData = JSON.parse((await combined.findById(fullPackage.exclusions))[0].data);
        fullPackage.exclusions = exclusionsData;

        return fullPackage;
    } catch (error) {
        console.log(`Error getting full package details for ${packageData.id}:`, error);
        return null;
    }
};

// Public API to get theme page by slug (no authentication required)
router.get("/public/:slug", async (req, resp) => {
    try {
        let { slug } = req.params;
        if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });

        let data = await themesPages.findAllWhere({ slug: slug, status: 'published' });
        if (!data || data.length === 0) return resp.status(404).send({ status: false, message: "Theme page not found" });

        let themeData = data[0];

        let currentThemePackages = themeData.mainPackages;
        currentThemePackages = JSON.parse((await combined.findAllWhere({ id: currentThemePackages }))[0].data);

        let temp = [];

        for (let i = 0; i < currentThemePackages.length; i++) {
            let packageData = await package.findAllWhere({ slug: currentThemePackages[i] });
            if (packageData.length > 0) {
                let fullpackageData = await getFullPackageDetails(packageData[0]);
                temp.push(fullpackageData);
            }
        }

        currentThemePackages = [...temp];
        temp = [];

        // console.log(currentThemePackages);

        let img = JSON.parse(themeData.images);
        let imagesData = [];
        let currentCategory = JSON.parse(themeData.type).category;
        let currentFrom = JSON.parse(themeData.type).from;

        for (let j = 0; j < img.length; j++) {
            imagesData.push((await image.findById(img[j])).file_path);
        }

        let meta = JSON.parse((await combined.findById(themeData.meta))[0].data);
        let popularDestinations = JSON.parse((await combined.findById(themeData.popularDestinations))[0].data);

        let allDestinations = [];

        for (let i = 0; i < popularDestinations.length; i++) {
            let destinationData = await destination.findAllWhere({ slug: popularDestinations[i] });

            let images = [];

            let count = 0;
            let slugForDestination = '';
            for (let j = 0; j < destinationData.length; j++) {
                let destinationDataNew = await destination.findAllWhere({ name: destinationData[j].name });

                for (let k = 0; k < destinationDataNew.length; k++) {
                    let currentType = (JSON.parse(destinationDataNew[k].type));
                    if (currentType.from !== "" && currentType.from === currentFrom) {
                        slugForDestination = destinationDataNew[k].slug;
                    } else if (currentType.category === currentCategory && currentType.from === '') {
                        slugForDestination = destinationDataNew[k].slug;
                    }
                }

                let allImages = JSON.parse(destinationData[j].images);
                if (allImages.length > 0) {
                    for (let k = 0; k < allImages.length; k++) {
                        images.push((await image.findById(allImages[k])).file_path);
                    }
                }
            }

            let destinationType = JSON.parse(destinationData[0].type);
            count = (await getPackagesCategory(destinationType.name, currentCategory)).totalPackages;

            allDestinations.push({
                name: destinationData[0].name,
                slug: slugForDestination,
                images: images,
                count: count || 0
            });
        }

        // Get all published packages that match this theme page's category
        let allPackagesData = [];
        let currentThemePageCategory = JSON.parse(data[0].type).category;

        allPackagesData = await getPackagesByCategoryOnly(currentThemePageCategory);

        // sort allPackagesData by highest days first
        allPackagesData.sort((a, b) => b.days - a.days);

        let finalPackages = [];

        // Add currentThemePackages first (on top)
        for (let i = 0; i < currentThemePackages.length; i++) {
            if (currentThemePackages[i]) {
                finalPackages.push(currentThemePackages[i]);
            }
        }

        const existingIds = new Set(currentThemePackages.map(pkg => pkg.id));

        // Add packages from allPackagesData that don't exist in currentThemePackages
        for (let i = 0; i < allPackagesData.length; i++) {
            if (allPackagesData[i] && !existingIds.has(allPackagesData[i].id)) {
                let journey = JSON.parse((await combined.findAllWhere({ id: allPackagesData[i].journey }))[0].data) || [];
                let itinerary = (await combined.findAllWhere({ id: allPackagesData[i].itinerary }))[0].data || [];
                let inclusions = (await combined.findAllWhere({ id: allPackagesData[i].inclusions }))[0].data || [];
                let exclusions = (await combined.findAllWhere({ id: allPackagesData[i].exclusions }))[0].data || [];

                allPackagesData[i].journey = journey;
                allPackagesData[i].itinerary = itinerary;
                allPackagesData[i].inclusions = inclusions;
                allPackagesData[i].exclusions = exclusions;

                finalPackages.push(allPackagesData[i]);
            }
        }

        // console.log(finalPackages.map(pkg => pkg.id));

        let faqs = JSON.parse((await combined.findById(themeData.faqs))[0].data);
        let title = JSON.parse(themeData.type).name;
        let fromDestination = JSON.parse(themeData.type).from;
        let category = JSON.parse(themeData.type).category;

        let responseData = {
            id: themeData.id,
            name: themeData.name,
            slug: themeData.slug,
            title: title,
            from: fromDestination,
            category: category,
            description: themeData.description,
            status: themeData.status,
            longDescription: themeData.longDescription,
            date: themeData.date,
            images: imagesData,
            meta: meta,
            popularDestinations: allDestinations,
            mainPackages: finalPackages,
            faqs: faqs
        };

        return resp.send(responseData);
    } catch (error) {
        console.log("Error in /public/:slug route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/get/:slug", async (req, resp) => {
    try {
        let { slug } = req.params;
        if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });
        let data = await themesPages.findAllWhere({ slug: slug });
        if (!data) return resp.status(404).send({ status: false, message: "No theme pages found" });

        let sendData = [];

        for (let i = 0; i < data.length; i++) {
            let img = JSON.parse(data[i].images);
            let imagesData = [];

            for (let j = 0; j < img.length; j++) {
                imagesData.push((await image.findById(img[j])).file_path);
            }
            let meta = JSON.parse((await combined.findById(data[i].meta))[0].data);
            let popularDestinations = JSON.parse((await combined.findById(data[i].popularDestinations))[0].data);
            let mainPackages = JSON.parse((await combined.findById(data[i].mainPackages))[0].data);
            let faqs = JSON.parse((await combined.findById(data[i].faqs))[0].data);
            let title = JSON.parse(data[i].type).name;
            let fromDestination = JSON.parse(data[i].type).from;
            let category = JSON.parse(data[i].type).category;

            sendData.push({
                id: data[i].id,
                name: data[i].name,
                slug: data[i].slug,
                title: title,
                from: fromDestination,
                category: category,
                description: data[i].description,
                status: data[i].status,
                longDescription: data[i].longDescription,
                date: data[i].date,
                images: imagesData,
                meta: meta,
                popularDestinations: popularDestinations,
                mainPackages: mainPackages,
                faqs: faqs
            });
        }
        return resp.send(sendData[0]);
    } catch (error) {
        console.log("Error in /get/:slug route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/validate-slug/:slug", async (req, resp) => {
    let { slug } = req.params;
    if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });
    let data = await themesPages.findAllWhere({ slug: slug });
    if (data.length > 0) return resp.send({ status: false, message: "Slug already exists" });
    return resp.send({ status: true, message: "Slug is available" });
})

router.post("/update/:slug", async (req, resp) => {
    let { admin } = req.headers;
    let { slug: urlSlug } = req.params;
    if (!urlSlug) return resp.status(400).send({ status: false, message: "Bad Request" });

    let { status, meta, fromDestination, name, category, title, slug, description, popularDestinations, mainPackages, longDescription, faqs } = JSON.parse(req.body.data);

    // Normalize images to array format
    let imageFiles = [];
    if (req.files && req.files.images) {
        if (Array.isArray(req.files.images)) {
            imageFiles = req.files.images;
        } else {
            imageFiles = [req.files.images];
        }
    }

    // Validate image count
    if (imageFiles.length > 3) {
        return resp.status(400).send({ status: false, message: "Maximum 3 images allowed" });
    }

    // If name is not provided, derive it from title
    if (!name && title) {
        name = title;
    }

    if (!status || !meta || !title || !slug || !description) {
        return resp.status(400).send({ status: false, message: "Missing required fields" });
    }

    if (!(await user.isRole(admin, ["admin", "subadmin"]))) return resp.status(401).send({ status: false, message: "Access Denied!" });

    // Find the current record by URL slug to get its ID
    let currentRecord = await themesPages.findAllWhere({ slug: urlSlug });
    if (currentRecord.length === 0) {
        return resp.status(404).send({ status: false, message: "Theme page not found" });
    }
    const currentId = currentRecord[0].id;

    // Check if the new slug conflicts with other records (exclude current record)
    if (slug !== urlSlug) {
        let allRecordsWithNewSlug = await themesPages.findAllWhere({ slug: slug });

        let conflictingSlugRecords = allRecordsWithNewSlug.filter(record => {
            const recordIdStr = String(record.id);
            const currentIdStr = String(currentId);
            const isConflict = recordIdStr !== currentIdStr;
            return isConflict;
        });

        if (conflictingSlugRecords.length > 0) {
            return resp.send({ status: false, message: "Slug already exists" });
        }
    }

    let type = {}
    let data = {};

    type.name = name;
    type.from = fromDestination;
    type.category = category;

    // Check if theme page exists for other records (exclude current record)
    let allRecordsWithType = await themesPages.findAllWhere({ type: JSON.stringify(type) });
    let conflictingTypeRecords = allRecordsWithType.filter(record => {
        const recordIdStr = String(record.id);
        const currentIdStr = String(currentId);
        return recordIdStr !== currentIdStr;
    });

    if (conflictingTypeRecords.length > 0) {
        return resp.send({ status: false, message: "Theme page already exists" });
    }

    data.name = name;
    data.type = JSON.stringify(type);
    data.title = title;
    data.slug = slug;
    data.description = description;
    data.longDescription = longDescription;
    data.status = status;

    // Update combined data
    if (currentRecord.length > 0) {
        await combined.update(currentRecord[0].meta, { type: "meta", data: meta });
        await combined.update(currentRecord[0].popularDestinations, { type: "popularDestinations", data: JSON.stringify(popularDestinations) });
        await combined.update(currentRecord[0].mainPackages, { type: "mainPackages", data: JSON.stringify(mainPackages) });
        await combined.update(currentRecord[0].faqs, { type: "faqs", data: faqs });
    }

    // Handle images if new ones are uploaded
    if (imageFiles.length > 0) {
        let img = [];
        try {
            for (let i = 0; i < imageFiles.length; i++) {
                const imageResult = await image.convertAndUpload(imageFiles[i], "themes-pages");
                if (imageResult && imageResult.insertId) {
                    img.push(imageResult.insertId);
                } else {
                    throw new Error(`Failed to upload image ${i + 1}`);
                }
            }
            data.images = JSON.stringify(img);
        } catch (error) {
            console.log("Error processing images:", error);
            return resp.status(500).send({ status: false, message: `Image processing failed: ${error.message}` });
        }
    }

    if (await themesPages.update(data, { id: currentId })) {
        return resp.send({ status: true, message: "Theme page updated successfully" });
    }

    return resp.send({ status: false, message: "Something went wrong" });
})

router.get("/popular-destinations/:name", async (req, resp) => {
    let { name } = req.params;
    if (!name) return resp.status(400).send({ status: false, message: "Bad Request" });

    let popularPackages = [];

    let packagesData = await package.findAll();
    if (!packagesData || packagesData.length === 0) return resp.status(404).send({ status: false, message: "Packages not found" });

    return resp.send({ status: true, message: "Packages fetched successfully", data: popularPackages });
})

router.post("/get-packages", async (req, resp) => {
    try {
        let category = req.body.category;

        if (!category) return resp.status(400).send({ status: false, message: "Bad Request" });

        let matchingPackages = await getPackagesByCategoryOnly(category);

        return resp.send({
            status: true,
            message: "Packages fetched successfully",
            data: matchingPackages,
            category: category,
            totalPackages: matchingPackages.length
        });
    } catch (error) {
        console.log("Error in /get-packages/:category route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/from-locations/:slug", async (req, resp) => {
    try {
        let { slug } = req.params;
        if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });

        let currentTheme = await themesPages.findAllWhere({ slug: slug });
        let currentThemeCategory = JSON.parse(currentTheme[0].type).category;
        let currentThemeFrom = JSON.parse(currentTheme[0].type).from;

        let allThemes = await themesPages.findAll();

        // Remove duplicates based on destination ID
        let uniqueDestinationsFrom = [];
        let uniqueDestinationsCategory = [];

        allThemes.map(theme => {
            let allThemeCategory = JSON.parse(theme.type).category;
            let allThemeFrom = JSON.parse(theme.type).from;

            if (currentThemeCategory === allThemeCategory && currentThemeFrom === '') {
                if (allThemeFrom !== currentThemeFrom) {
                    uniqueDestinationsFrom.push(theme);
                }
            }

            if (currentThemeCategory !== allThemeCategory) {
                if (currentThemeFrom === '') {
                    if (allThemeFrom === '') {
                        uniqueDestinationsCategory.push(theme);
                    }
                }
            }

            if (currentThemeFrom !== '') {
                if (allThemeCategory === currentThemeCategory && allThemeFrom !== currentThemeFrom && allThemeFrom !== '') {
                    uniqueDestinationsFrom.push(theme);
                }

                if (allThemeCategory !== currentThemeCategory && allThemeFrom === currentThemeFrom) {
                    uniqueDestinationsCategory.push(theme);
                }
            }
        });

        let data = {
            from: uniqueDestinationsFrom,
            cate: uniqueDestinationsCategory
        }

        return resp.send({
            status: true,
            message: "Related destinations fetched successfully",
            data: data,
            totalDestinations: uniqueDestinationsFrom.length
        });
    } catch (error) {
        console.log("Error in /from-locations/:slug route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

const getPackagesByCategoryOnly = async (category) => {
    if (!category) return resp.status(400).send({ status: false, message: "Bad Request" });

    let allCategories = [];
    allCategories = await theme.findAll();

    let currentCategory;

    allCategories.map(c => {
        if (c.name === category) {
            currentCategory = c.slug;
        }
    });

    // Find all published packages
    let allPackages = await package.findAll();
    let matchingPackages = [];

    // Helper function to get full package details
    const getFullPackageDetails = async (packageData) => {
        try {
            let fullPackage = { ...packageData };

            // Get time data
            let timeData = JSON.parse((await combined.findById(fullPackage.time))[0].data);
            fullPackage.days = timeData.days;
            fullPackage.nights = timeData.nights;

            let themesData = JSON.parse((await combined.findById(fullPackage.themes))[0].data);
            fullPackage.themes = themesData;

            // Get meta data
            let metaData = JSON.parse((await combined.findById(fullPackage.meta))[0].data);
            fullPackage.metaTitle = metaData.title;
            fullPackage.metaTags = metaData.tags;

            // Get pricing data
            let priceData = JSON.parse((await combined.findById(fullPackage.price))[0].data);
            fullPackage.pricing = {
                deluxe: priceData[0],
                luxury: priceData[1],
                premium: priceData[2]
            };

            // Get images
            let imageIds = JSON.parse(fullPackage.images);
            let images = [];
            for (let k = 0; k < imageIds.length; k++) {
                let img = await image.findById(imageIds[k]);
                if (img) {
                    images.push(img.file_path);
                }
            }
            fullPackage.images = images;

            // Get destination details
            let packageDestinations = JSON.parse((await combined.findById(fullPackage.destinations))[0].data);
            let destinationDetails = [];
            for (let k = 0; k < packageDestinations.length; k++) {
                let destResult = await destination.findAllWhere({ id: packageDestinations[k] });
                if (destResult && destResult[0]) {
                    destinationDetails.push(destResult[0]);
                }
            }
            fullPackage.destinations = destinationDetails;

            // Get includes data
            let includesData = JSON.parse((await combined.findById(fullPackage.includes))[0].data);
            let includes = [];
            for (let k = 0; k < includesData.length; k++) {
                let includeResult = await include.query(`SELECT include.name, image.file_path, include.id FROM include INNER JOIN image ON include.image = image.id WHERE include.name = '${includesData[k]}'`);
                if (includeResult && includeResult[0]) {
                    includes.push(includeResult[0]);
                }
            }
            fullPackage.includes = includes;

            return fullPackage;
        } catch (error) {
            console.log(`Error getting full package details for ${packageData.id}:`, error);
            return null;
        }
    };

    // Check each package's destinations to see if any match the category
    for (let i = 0; i < allPackages.length; i++) {
        try {
            let fullPackage = await getFullPackageDetails(allPackages[i]);

            if (fullPackage.themes.includes(currentCategory)) {
                matchingPackages.push(fullPackage);
            }
        } catch (error) {
            console.log(`Error processing package ${allPackages[i].id}:`, error);
            continue; // Skip this package and continue with others
        }
    }

    return matchingPackages;
}

module.exports = router;