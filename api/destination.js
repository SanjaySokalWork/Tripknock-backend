const express = require("express");
const router = express.Router();
const Destination = require("../tables/destination");
const destination = new Destination();
const User = require("../tables/user");
const user = new User();
const Theme = require("../tables/theme");
const theme = new Theme();
const Combined = require("../tables/combined");
const combined = new Combined();
const Image = require("../tables/image");
const image = new Image();
const Package = require("../tables/package");
const package = new Package();
const Country = require("../tables/country");
const country = new Country();

router.get("/all", async (req, resp) => {
    try {
        let data = await destination.findAll();
        if (!data) return resp.status(404).send({ status: false, message: "No destinations found" });

        let sendData = [];

        for (let i = 0; i < data.length; i++) {
            let img = JSON.parse(data[i].images);
            let imagesData = [];

            for (let i = 0; i < img.length; i++) {
                imagesData.push((await image.findById(img[i])).file_path);
            }
            let meta = JSON.parse((await combined.findById(data[i].meta))[0].data);
            let popularPackages = JSON.parse((await combined.findById(data[i].popularPackages))[0].data);
            let mainPackages = JSON.parse((await combined.findById(data[i].mainPackages))[0].data);
            let faqs = JSON.parse((await combined.findById(data[i].faqs))[0].data);
            let title = JSON.parse(data[i].type).name;
            let fromDestination = JSON.parse(data[i].type).from;
            let category = JSON.parse(data[i].type).category;

            sendData.push({
                id: data[i].id,
                name: data[i].name,
                slug: data[i].slug,
                title: data[i].title,
                destination: title,
                from: fromDestination,
                category: category,
                country: data[i].country,
                description: data[i].description,
                status: data[i].status,
                longDescription: data[i].longDescription,
                date: data[i].date,
                images: imagesData,
                meta: meta,
                popularPackages: popularPackages,
                mainPackages: mainPackages,
                faqs: faqs
            });
        }
        // console.log(sendData)
        return resp.send(sendData);
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/load", async (req, resp) => {
    let pachages = await package.findAll();
    let countries = await country.findAll();
    resp.send({ pachages: pachages, country: countries });
})

router.post("/create", async (req, resp) => {
    let { admin } = req.headers;
    let { status, meta, fromDestination, name, category, country, title, slug, description, popularPackages, mainPackages, longDescription, faqs } = JSON.parse(req.body.data);

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

    if (!name || !status || !meta || !title || !slug || !description || !country) {
        return resp.status(400).send({ status: false, message: "Missing required fields" });
    }

    // Validation messages for package requirements
    let validationMessages = [];
    let originalStatus = status;

    // Check for minimum 4 popular packages
    if (!popularPackages || !Array.isArray(popularPackages) || popularPackages.length < 4) {
        validationMessages.push("At least 4 popular packages are required");
        // status = "draft";
    }

    // Check for at least 1 main package  
    // if (!mainPackages || !Array.isArray(mainPackages) || mainPackages.length < 1) {
        // validationMessages.push("At least 1 main package is required");
        // status = "draft";
    // }

    // Auto-set to draft if missing critical data or no images for published status
    if (!status || !meta || !name || !country || !title || !description || !longDescription || !faqs) {
        status = "draft";
    }

    // For published destinations, require at least one image
    if (status === 'published' && imageFiles.length === 0) {
        return resp.status(400).send({ status: false, message: "At least one image is required for published destinations" });
    }

    if (!(await user.isRole(admin, ["admin", "subadmin"]))) return resp.status(401).send({ status: false, message: "Access Denied!" });

    if (await destination.existsBySlug(slug)) return resp.send({ status: false, message: "Destination already exists" });

    let type = {}
    let data = {};

    type.name = name;
    type.from = fromDestination;
    type.category = category;
    if (await destination.exists({ type: JSON.stringify(type) })) return resp.send({ status: false, message: "Destination already exists" });
    data.name = name;
    data.type = JSON.stringify(type);
    data.meta = (await combined.create({ type: "meta", data: meta })).insertId;
    data.country = country;
    data.title = title;
    data.slug = slug;
    data.description = description;
    data.popularPackages = (await combined.create({ type: "popularPackages", data: JSON.stringify(popularPackages) })).insertId;
    data.mainPackages = (await combined.create({ type: "mainPackages", data: JSON.stringify(mainPackages) })).insertId;
    data.longDescription = longDescription;
    data.faqs = (await combined.create({ type: "faqs", data: faqs })).insertId;
    data.status = status;

    let img = [];
    try {
        if (imageFiles.length > 0) {
            for (let i = 0; i < imageFiles.length; i++) {
                const imageResult = await image.convertAndUpload(imageFiles[i], "destination");
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

    if (await destination.create(data)) {
        // Return appropriate message based on validation
        if (validationMessages.length > 0 && originalStatus === 'published') {
            return resp.send({
                status: true,
                message: `Destination saved as draft: ${validationMessages.join(', ')}`,
                actualStatus: 'draft',
                validationErrors: validationMessages
            });
        }
        return resp.send({ status: true, message: "Destination created successfully" });
    }

    return resp.send({ status: false, message: "Something went wrong" });
})

router.post("/validate", async (req, resp) => {
    let { slug } = req.body;
    if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });
    if (await destination.existsBySlug(slug)) {
        return resp.send({ status: false, message: "Slug already exists" });
    }
    return resp.send({ status: true, message: "Slug available" });
})

router.post("/validate-destination", async (req, resp) => {
    let data = req.body;
    if (!data) return resp.status(400).send({ status: false, message: "Bad Request" });
    if (await destination.exists({ type: JSON.stringify(data) })) {
        return resp.send({ status: false, message: "Destination already exists" });
    }
    return resp.send({ status: true, message: "Destination available" });
})

router.post("/delete", async (req, resp) => {
    let { admin } = req.headers;
    const { id } = req.body;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });
    if (!id) return resp.status(500).send({ status: false, message: "Internal Server Error" });
    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            if (await destination.delete({ id: id })) {
                return resp.send({ status: true, message: "Destination deleted successfully" });
            }
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in /delete route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/get/:slug", async (req, resp) => {
    try {
        let { slug } = req.params;
        if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });
        let data = await destination.findAllWhere({ slug: slug });
        if (!data || data.length === 0) return resp.status(404).send({ status: false, message: "Destination not found" });

        let item = data[0];
        let img = JSON.parse(item.images);
        let imagesData = [];

        for (let i = 0; i < img.length; i++) {
            imagesData.push((await image.findById(img[i])).file_path);
        }
        let meta = JSON.parse((await combined.findById(item.meta))[0].data);
        let popularPackages = JSON.parse((await combined.findById(item.popularPackages))[0].data);
        let mainPackages = JSON.parse((await combined.findById(item.mainPackages))[0].data);
        let faqs = JSON.parse((await combined.findById(item.faqs))[0].data);
        let title = item.title;
        let fromDestination = JSON.parse(item.type).from;
        let category = JSON.parse(item.type).category;

        let sendData = {
            id: item.id,
            name: item.name,
            slug: item.slug,
            title: title,
            from: fromDestination,
            category: category,
            country: item.country,
            description: item.description,
            status: item.status,
            longDescription: item.longDescription,
            date: item.date,
            images: imagesData,
            meta: meta,
            popularPackages: popularPackages,
            mainPackages: mainPackages,
            faqs: faqs
        };

        return resp.send(sendData);
    } catch (error) {
        console.log("Error in /get/:slug route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/public-get/:slug", async (req, resp) => {
    try {
        let { slug } = req.params;
        if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });
        let data = await destination.findAllWhere({ slug: slug, status: "published" });
        if (!data || data.length === 0) return resp.status(404).send({ status: false, message: "Destination not found" });

        let item = data[0];
        let itemType = JSON.parse(data[0].type);
        let img = JSON.parse(item.images);
        let imagesData = [];

        for (let i = 0; i < img.length; i++) {
            imagesData.push((await image.findById(img[i])).file_path);
        }
        let meta = JSON.parse((await combined.findById(item.meta))[0].data);
        let popularPackages = JSON.parse((await combined.findById(item.popularPackages))[0].data);

        let mainPackages = JSON.parse((await combined.findById(item.mainPackages))[0].data);

        let allPackages = await getPackagesCategory(itemType.name, itemType.category);

        // console.log(allPackages);

        let currentAllPackages = [];

        mainPackages.map(ele => currentAllPackages.push(ele));

        for (let i = 0; i < allPackages.data.length; i++) {
            let days = JSON.parse((await combined.findById(allPackages.data[i].time))[0].data).days;

            allPackages.data[i].days = days;
        }

        allPackages.data.sort((a, b) => a.days - b.days);

        allPackages.data.map(ele => {
            if (!mainPackages.includes(ele.slug)) {
                currentAllPackages.push(ele.slug);
            }
        })

        let faqs = JSON.parse((await combined.findById(item.faqs))[0].data);
        let title = item.title;
        let fromDestination = JSON.parse(item.type).from;
        let category = JSON.parse(item.type).category;

        let sendData = {
            id: item.id,
            name: item.name,
            slug: item.slug,
            title: title,
            from: fromDestination,
            category: category,
            country: item.country,
            description: item.description,
            status: item.status,
            longDescription: item.longDescription,
            date: item.date,
            images: imagesData,
            meta: meta,
            popularPackages: popularPackages,
            mainPackages: currentAllPackages,
            faqs: faqs
        };

        return resp.send(sendData);
    } catch (error) {
        console.log("Error in /get/:slug route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

// New endpoint for published destinations (for frontend use)
router.get("/published", async (req, resp) => {
    try {
        let data = await destination.findAll();
        if (!data || data.length === 0) return resp.status(404).send({ status: false, message: "No published destinations found" });

        let sendData = [];

        for (let i = 0; i < data.length; i++) {
            let img = JSON.parse(data[i].images);
            let imagesData = [];

            for (let j = 0; j < img.length; j++) {
                imagesData.push((await image.findById(img[j])).file_path);
            }
            let meta = JSON.parse((await combined.findById(data[i].meta))[0].data);
            let title = data[i].title;
            let fromDestination = JSON.parse(data[i].type).from;
            let category = JSON.parse(data[i].type).category;

            sendData.push({
                id: data[i].id,
                name: data[i].name,
                slug: data[i].slug,
                title: title,
                from: fromDestination,
                category: category,
                country: data[i].country,
                description: data[i].description,
                status: data[i].status,
                date: data[i].date,
                images: imagesData,
                meta: meta
            });
        }
        return resp.send(sendData);
    } catch (error) {
        console.log("Error in /published route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.post("/update/:mainSlug", async (req, resp) => {
    try {
        let { admin } = req.headers;
        let { mainSlug } = req.params;

        let requestData = JSON.parse(req.body.data);
        let { status, meta, fromDestination, name, category, country, title, slug, description, popularPackages, mainPackages, longDescription, faqs, existingImages } = requestData;

        if (!mainSlug || !admin) {
            return resp.status(400).send({ status: false, message: "Bad Request" });
        }

        // Normalize images to array format (express-fileupload sends single file as object, multiple as array)
        let imageFiles = [];
        if (req.files && req.files.images) {
            if (Array.isArray(req.files.images)) {
                imageFiles = req.files.images;
            } else {
                imageFiles = [req.files.images]; // Single file case
            }
        }

        // Validate image count after normalizing
        if (imageFiles.length > 3) {
            return resp.status(400).send({ status: false, message: "Maximum 3 images allowed" });
        }

        // For published destinations, ensure we have at least one image (existing or new)
        if (status === 'published') {
            const hasExistingImages = existingImages && existingImages.length > 0;
            const hasNewImages = imageFiles && imageFiles.length > 0;
            if (!hasExistingImages && !hasNewImages) {
                return resp.status(400).send({ status: false, message: "At least one image is required for published destinations" });
            }
        }

        // Validation messages for package requirements
        let validationMessages = [];
        let originalStatus = status;

        // Check for minimum 4 popular packages
        if (!popularPackages || !Array.isArray(popularPackages) || popularPackages.length < 4) {
            validationMessages.push("At least 4 popular packages are required");
            // status = "draft";
        }

        // Check for at least 1 main package
        // if (!mainPackages || !Array.isArray(mainPackages) || mainPackages.length < 1) {
        //     validationMessages.push("At least 1 main package is required");
        //     status = "draft";
        // }

        // Auto-set to draft if missing critical data
        if (!status || !meta || !name || !country || !title || !slug || !description || !longDescription || !faqs) {
            status = "draft";
        }

        if (!(await user.isRole(admin, ["admin", "subadmin"]))) return resp.status(401).send({ status: false, message: "Access Denied!" });

        let type = {}
        let data = {};

        let destinationData = (await destination.findAllWhere({ slug: mainSlug }))[0];
        if (!destinationData) return resp.status(404).send({ status: false, message: "Destination not found" });

        // Always update type if name is provided (name is required)
        if (name) {
            type.name = name;
            type.from = fromDestination || ""; // Allow empty fromDestination
            type.category = category || ""; // Allow empty category

            // console.log("Current type:", destinationData.type);
            // console.log("New type:", JSON.stringify(type));

            if (destinationData.type !== JSON.stringify(type)) {
                // Only check for existence if the combination would create a meaningful destination
                if (name && (fromDestination || category)) {
                    if (await destination.exists({ type: JSON.stringify(type) })) {
                        return resp.send({ status: false, message: "Destination already exists" });
                    }
                }
                data.type = JSON.stringify(type);
                console.log("Type will be updated to:", JSON.stringify(type));
            } else {
                console.log("Type unchanged");
            }
        }

        if (name && destinationData.name !== name) data.name = name;

        if (meta) {
            let mta = (await combined.findById(destinationData.meta))[0].data;
            if (mta !== meta) {
                data.meta = (await combined.update(destinationData.meta, { type: "meta", data: meta })).insertId;
            }
        }

        if (country && destinationData.country !== country) data.country = country;
        if (title && destinationData.title !== title) data.title = title;

        if (slug && destinationData.slug !== slug) data.slug = slug;
        if (description && destinationData.description !== description) data.description = description;

        if (popularPackages) {
            // console.log("Processing popular packages:", popularPackages);
            let pp = (await combined.findById(destinationData.popularPackages))[0].data;
            // console.log("Existing popular packages:", pp);
            if (pp !== JSON.stringify(popularPackages)) {
                // console.log("Updating popular packages");
                await combined.update(destinationData.popularPackages, { type: "popularPackages", data: JSON.stringify(popularPackages) });
            } else {
                // console.log("Popular packages unchanged");
            }
        }

        if (mainPackages) {
            // console.log("Processing main packages:", mainPackages);
            let mp = (await combined.findById(destinationData.mainPackages))[0].data;
            // console.log("Existing main packages:", mp);
            if (mp !== JSON.stringify(mainPackages)) {
                // console.log("Updating main packages");
                await combined.update(destinationData.mainPackages, { type: "mainPackages", data: JSON.stringify(mainPackages) });
            } else {
                // console.log("Main packages unchanged");
            }
        }

        if (longDescription && destinationData.longDescription !== longDescription) data.longDescription = longDescription;

        if (faqs) {
            let fq = (await combined.findById(destinationData.faqs))[0].data;
            if (fq !== faqs) {
                await combined.update(destinationData.faqs, { type: "faqs", data: faqs });
            }
        }

        if (status && destinationData.status !== status) data.status = status;

        // Handle image updates
        if (existingImages || imageFiles.length > 0) {
            let finalImgIndex = [];

            // Process existing images
            if (existingImages && existingImages.length > 0) {
                for (let i = 0; i < existingImages.length; i++) {
                    try {
                        let img = await image.find({ file_path: existingImages[i] });
                        if (img && img[0]) {
                            finalImgIndex.push(img[0].id);
                        }
                    } catch (error) {
                        console.log(`Error processing existing image ${i + 1}:`, error);
                    }
                }
            }

            // Process new images
            if (imageFiles.length > 0) {
                try {
                    for (let i = 0; i < imageFiles.length; i++) {
                        const imageResult = await image.convertAndUpload(imageFiles[i], "destination");
                        if (imageResult && imageResult.insertId) {
                            finalImgIndex.push(imageResult.insertId);
                        }
                    }
                } catch (error) {
                    console.log("Error uploading new images:", error);
                    return resp.status(500).send({ status: false, message: `Image processing failed: ${error.message}` });
                }
            }

            // Only require images for published destinations
            if (status === 'published' && finalImgIndex.length === 0) {
                return resp.status(400).send({ status: false, message: "At least one image is required for published destinations" });
            }

            data.images = JSON.stringify(finalImgIndex);
        }

        if (Object.keys(data).length !== 0) {
            // console.log("Updating destination with data:", data);
            // console.log("Where condition:", { slug: mainSlug });
            await destination.update(data, { slug: mainSlug });
            // console.log("Destination update completed");
        } else {
            console.log("No main destination data changes detected");
        }

        // Return appropriate message based on validation
        if (validationMessages.length > 0 && originalStatus === 'published') {
            return resp.send({
                status: true,
                message: `Destination updated and saved as draft: ${validationMessages.join(', ')}`,
                actualStatus: 'draft',
                validationErrors: validationMessages
            });
        }
        return resp.send({ status: true, message: "Destination updated successfully" });
    } catch (error) {
        console.log("Error in destination update:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

// New endpoint to get packages for a specific destination
router.get("/packages/:slug", async (req, resp) => {
    try {
        let { slug } = req.params;
        if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });

        let destinationData = await destination.findAllWhere({ slug: slug });
        if (!destinationData || destinationData.length === 0) return resp.status(404).send({ status: false, message: "Destination not found" });

        let item = destinationData[0];
        let popularPackageIds = JSON.parse((await combined.findById(item.popularPackages))[0].data);
        let mainPackageIds = JSON.parse((await combined.findById(item.mainPackages))[0].data);

        return resp.send({
            popularPackages: popularPackageIds,
            mainPackages: mainPackageIds,
            fromLocations: item.from ? JSON.parse(item.type).from : []
        });
    } catch (error) {
        console.log("Error in /packages/:slug route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/from-locations/:slug", async (req, resp) => {
    try {
        let { slug } = req.params;
        if (!slug) return resp.status(400).send({ status: false, message: "Bad Request" });

        let destinationData = await destination.findAllWhere({ slug: slug });
        if (!destinationData || destinationData.length === 0) return resp.status(404).send({ status: false, message: "Destination not found" });

        let currentDestination = JSON.parse(destinationData[0].type);
        let currentFrom = currentDestination.from;
        let currentCategory = currentDestination.category;
        let currentDestinationName = currentDestination.name;

        let allDestinations = await destination.findAllWhere({ status: "published" });
        let fromLocations = [];
        let categoryLocations = [];

        for (let i = 0; i < allDestinations.length; i++) {
            let item = JSON.parse(allDestinations[i].type);
            let allItemName = item.name;
            let allItemFrom = item.from;
            let allItemCategory = item.category;

            if (currentDestinationName === allItemName) {
                if (currentCategory === allItemCategory) {
                    if (currentFrom === '' && (allItemFrom !== '')) {
                        fromLocations.push(allDestinations[i]);
                    } else {
                        if ((currentFrom !== '') && (allItemFrom !== '')) {
                            if (allItemFrom !== currentFrom) {
                                fromLocations.push(allDestinations[i]);
                            }
                        }
                    }
                }
            }

            if (currentDestinationName == allItemName) {
                if (currentFrom === allItemFrom) {
                    if (currentCategory === '' && (allItemCategory !== '')) {
                        categoryLocations.push(allDestinations[i]);
                    } else {
                        if ((currentCategory !== '') && (allItemCategory !== '')) {
                            if (allItemCategory !== currentCategory) {
                                categoryLocations.push(allDestinations[i]);
                            }
                        }
                    }
                }
            }
        }

        return resp.send({ data: { from: fromLocations, cate: categoryLocations } });
    } catch (error) {
        console.log("Error in /from-locations/:slug route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

const getPackages = async (name) => {
    if (!name) return { status: false, message: "Bad Request" };

    try {
        // Find all published packages
        let allPackages = await package.findAllWhere({ status: "published" });

        // Find all published destinations that match the given name
        let allDestinations = await destination.findAllWhere({ status: "published" });
        let matchingDestinations = [];

        for (let i = 0; i < allDestinations.length; i++) {
            let destinationType = JSON.parse(allDestinations[i].type);
            if (destinationType.name.toLowerCase() === name.toLowerCase()) {
                matchingDestinations.push(allDestinations[i]);
            }
        }

        if (matchingDestinations.length === 0) {
            return {
                status: true,
                data: [],
                destinationName: name,
                foundDestinations: 0,
                totalPackages: 0
            }
        }

        // Helper function to get full package details
        const getPackageDetails = async (packageData) => {
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

                return fullPackage;
            } catch (error) {
                console.log(`Error getting package details for ${packageData.id}:`, error);
                return null;
            }
        };

        let mainPackages = [];
        let selectedPackageIds = new Set();

        // Get main packages from matching destinations (same name, category, from)
        for (let dest of matchingDestinations) {
            try {
                let destinationType = JSON.parse(dest.type);
                let mainPackageIds = JSON.parse((await combined.findById(dest.mainPackages))[0].data);

                for (let packageId of mainPackageIds) {
                    if (!selectedPackageIds.has(packageId)) {
                        let packageData = allPackages.find(pkg => pkg.id === packageId);
                        if (packageData) {
                            let fullPackage = await getPackageDetails(packageData);
                            if (fullPackage) {
                                mainPackages.push(fullPackage);
                                selectedPackageIds.add(packageId);
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(`Error processing main packages for destination ${dest.id}:`, error);
                continue;
            }
        }

        // Find other packages that match same destination criteria (name, category, from)
        let otherPackages = [];

        for (let dest of matchingDestinations) {
            try {
                let destinationType = JSON.parse(dest.type);
                let targetName = destinationType.name;
                let targetCategory = destinationType.category || '';
                let targetFrom = destinationType.from || '';

                // Find all destinations with same name, category, and from
                let similarDestinations = allDestinations.filter(d => {
                    let dtype = JSON.parse(d.type);
                    return dtype.name.toLowerCase() === targetName.toLowerCase() &&
                        (dtype.category || '') === targetCategory &&
                        (dtype.from || '') === targetFrom;
                });

                let similarDestinationIds = similarDestinations.map(d => d.id);

                // Find packages that include these similar destinations
                for (let pkg of allPackages) {
                    if (!selectedPackageIds.has(pkg.id)) {
                        try {
                            let packageDestinations = JSON.parse((await combined.findById(pkg.destinations))[0].data);

                            // Check if package includes any of the similar destinations
                            let hasMatchingDestination = packageDestinations.some(destId =>
                                similarDestinationIds.includes(destId)
                            );

                            if (hasMatchingDestination) {
                                let fullPackage = await getPackageDetails(pkg);
                                if (fullPackage) {
                                    otherPackages.push(fullPackage);
                                    selectedPackageIds.add(pkg.id);
                                }
                            }
                        } catch (error) {
                            console.log(`Error processing package ${pkg.id}:`, error);
                            continue;
                        }
                    }
                }
            } catch (error) {
                console.log(`Error processing other packages for destination ${dest.id}:`, error);
                continue;
            }
        }

        // Combine main packages (on top) with other packages
        let finalPackages = [...mainPackages, ...otherPackages];

        return {
            status: true,
            data: finalPackages,
            destinationName: name,
            foundDestinations: matchingDestinations.length,
            totalPackages: finalPackages.length,
            mainPackagesCount: mainPackages.length,
            otherPackagesCount: otherPackages.length
        };

    } catch (error) {
        console.log("Error in getPackages function:", error);
        return { status: false, message: "Internal Server Error" };
    }
}

router.get("/popular-packages/:name", async (req, resp) => {
    try {
        let { name } = req.params;
        if (!name) return resp.status(400).send({ status: false, message: "Bad Request" });

        let matchingPackages = await getPackages(name);

        // console.log(matchingPackages);

        return resp.send(matchingPackages);
    } catch (error) {
        console.log("Error in /popular-packages/:name route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.post("/popular-packages", async (req, resp) => {
    try {
        let { dname, cname } = req.body;
        if (!dname) return resp.status(400).send({ status: false, message: "Bad Request" });

        let matchingPackages = await getPackagesCategory(dname, cname);

        // console.log(matchingPackages);

        return resp.send(matchingPackages);
    } catch (error) {
        console.log("Error in /popular-packages route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

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

        // console.log(finalPackagesData);

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

module.exports = router;
