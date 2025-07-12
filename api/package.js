const express = require("express");
const router = express.Router();
const Package = require("../tables/package");
const package = new Package();
const User = require("../tables/user");
const user = new User();
const Combined = require("../tables/combined");
const combined = new Combined();
const Image = require("../tables/image");
const image = new Image();
const Theme = require("../tables/theme");
const theme = new Theme();
const Destination = require("../tables/destination");
const destination = new Destination();
const Include = require("../tables/include");
const include = new Include();
const Season = require("../tables/season");
const season = new Season();

router.get("/all", async (req, resp) => {
    let data = await package.findAll();

    for (let i = 0; i < data.length; i++) {
        let time = JSON.parse((await combined.findById(data[i].time))[0].data);
        let destinations = JSON.parse((await combined.findById(data[i].destinations))[0].data);
        let seasons = JSON.parse((await combined.findById(data[i].seasons))[0].data);
        let meta = JSON.parse((await combined.findById(data[i].meta))[0].data);
        let journey = JSON.parse((await combined.findById(data[i].journey))[0].data);
        let itinerary = JSON.parse((await combined.findById(data[i].itinerary))[0].data);
        let inclusions = JSON.parse((await combined.findById(data[i].inclusions))[0].data);
        let exclusions = JSON.parse((await combined.findById(data[i].exclusions))[0].data);
        let price = JSON.parse((await combined.findById(data[i].price))[0].data);
        let faq = JSON.parse((await combined.findById(data[i].faq))[0].data);
        let themes = JSON.parse((await combined.findById(data[i].themes))[0].data);
        let images = JSON.parse(data[i].images);
        for (let j = 0; j < images.length; j++) {
            images[j] = (await image.findById(images[j])).file_path;
        }

        if (typeof destinations === "object") {
            for (let j = 0; j < destinations.length; j++) {
                const destResult = await destination.findAllWhere({ id: destinations[j] });
                destinations[j] = destResult[0];
            }
        }

        data[i].time = time;
        data[i].destinations = destinations;
        data[i].seasons = seasons;
        data[i].meta = meta;
        data[i].journey = journey;
        data[i].itinerary = itinerary;
        data[i].inclusions = inclusions;
        data[i].exclusions = exclusions;
        data[i].price = price;
        data[i].faq = faq;
        data[i].images = images;
        data[i].themes = themes;
    }
    return resp.send(data);
});

router.get("/get/:slug", async (req, resp) => {
    let slug = req.params.slug;
    if (!(await package.existBySlug(slug))) return resp.send({ status: false, message: "Package Not Found" });
    slug = await package.findBySlug(slug);
    if (!slug || slug.length <= 0) return resp.send({ status: false, message: "Package Not Found" });
    let data = [];
    data.push(slug);

    for (let i = 0; i < data.length; i++) {
        let time = JSON.parse((await combined.findById(data[i].time))[0].data);
        let destinations = JSON.parse((await combined.findById(data[i].destinations))[0].data);
        let seasons = JSON.parse((await combined.findById(data[i].seasons))[0].data);
        let themes = JSON.parse((await combined.findById(data[i].themes))[0].data);
        let meta = JSON.parse((await combined.findById(data[i].meta))[0].data);
        let journey = JSON.parse((await combined.findById(data[i].journey))[0].data);
        let itinerary = JSON.parse((await combined.findById(data[i].itinerary))[0].data);
        let inclusions = JSON.parse((await combined.findById(data[i].inclusions))[0].data);
        let exclusions = JSON.parse((await combined.findById(data[i].exclusions))[0].data);
        let price = JSON.parse((await combined.findById(data[i].price))[0].data);
        let faq = JSON.parse((await combined.findById(data[i].faq))[0].data);
        let includes = JSON.parse((await combined.findById(data[i].includes))[0].data);
        let images = JSON.parse(data[i].images);
        for (let j = 0; j < images.length; j++) {
            images[j] = (await image.findById(images[j])).file_path;
        }

        if (typeof destinations === "object") {
            for (let j = 0; j < destinations.length; j++) {
                const destResult = await destination.findAllWhere({ id: destinations[j] });
                destinations[j] = destResult[0];
            }
        }

        data[i].days = time.days;
        data[i].nights = time.nights;

        data[i].destinations = destinations;
        data[i].seasons = seasons;

        data[i].metaTitle = meta.title;
        data[i].metaTags = meta.tags;
        data[i].extraMetaTags = meta.extraTags;

        data[i].journey = journey;
        data[i].itinerary = itinerary;
        data[i].inclusions = inclusions;
        data[i].exclusions = exclusions;
        data[i].faqs = faq;

        data[i].images = images;
        data[i].customization = data[i].customize;
        data[i].maxGroupSize = data[i].maxGroup;
        data[i].themes = themes;
        data[i].includes = includes;

        data[i].pricing = {
            deluxe: {
                regularPrice: price[0].regular,
                discountedPrice: price[0].discount,
                pricingInfo: price[0].info,
                emiStartsFrom: price[0].emi,
                additionalEmiInfo: price[0].addInfo
            },
            luxury: {
                regularPrice: price[1].regular,
                discountedPrice: price[1].discount,
                pricingInfo: price[1].info,
                emiStartsFrom: price[1].emi,
                additionalEmiInfo: price[1].addInfo
            },
            premium: {
                regularPrice: price[2].regular,
                discountedPrice: price[2].discount,
                pricingInfo: price[2].info,
                emiStartsFrom: price[2].emi,
                additionalEmiInfo: price[2].addInfo
            }
        };
    }

    return resp.send(data[0]);
});

router.get("/get-public/:slug", async (req, resp) => {
    let slug = req.params.slug;
    if (!(await package.existBySlug(slug))) return resp.send({ status: false, message: "Package Not Found" });
    slug = await package.findBySlug(slug);
    if (!slug || slug.length <= 0) return resp.send({ status: false, message: "Package Not Found" });
    let data = [];
    data.push(slug);

    for (let i = 0; i < data.length; i++) {
        let time = JSON.parse((await combined.findById(data[i].time))[0].data);
        let destinations = JSON.parse((await combined.findById(data[i].destinations))[0].data);
        let seasons = JSON.parse((await combined.findById(data[i].seasons))[0].data);
        let themes = JSON.parse((await combined.findById(data[i].themes))[0].data);
        let meta = JSON.parse((await combined.findById(data[i].meta))[0].data);
        let journey = JSON.parse((await combined.findById(data[i].journey))[0].data);
        let itinerary = JSON.parse((await combined.findById(data[i].itinerary))[0].data);
        let inclusions = JSON.parse((await combined.findById(data[i].inclusions))[0].data);
        let exclusions = JSON.parse((await combined.findById(data[i].exclusions))[0].data);
        let price = JSON.parse((await combined.findById(data[i].price))[0].data);
        let faq = JSON.parse((await combined.findById(data[i].faq))[0].data);
        let includes = JSON.parse((await combined.findById(data[i].includes))[0].data);

        for (let i = 0; i < includes.length; i++) {
            includes[i] = (await include.query(`SELECT include.name, image.file_path, include.id FROM include inner join image on include.image = image.id WHERE include.name = '${includes[i]}'`))[0];
        }

        let images = JSON.parse(data[i].images);
        for (let j = 0; j < images.length; j++) {
            images[j] = (await image.findById(images[j])).file_path;
        }

        if (typeof destinations === "object") {
            for (let j = 0; j < destinations.length; j++) {
                const destResult = await destination.findAllWhere({ id: destinations[j] });
                destinations[j] = destResult[0];
            }
        }

        data[i].days = time.days;
        data[i].nights = time.nights;

        data[i].destinations = destinations;
        data[i].seasons = seasons;

        data[i].metaTitle = meta.title;
        data[i].metaTags = meta.tags;
        data[i].extraMetaTags = meta.extraTags;

        data[i].journey = journey;
        data[i].itinerary = itinerary;
        data[i].inclusions = inclusions;
        data[i].exclusions = exclusions;
        data[i].faqs = faq;

        data[i].images = images;
        data[i].customization = data[i].customize;
        data[i].maxGroupSize = data[i].maxGroup;
        data[i].themes = themes;
        data[i].includes = includes;

        data[i].pricing = {
            deluxe: {
                regularPrice: price[0].regular,
                discountedPrice: price[0].discount,
                pricingInfo: price[0].info,
                emiStartsFrom: price[0].emi,
                additionalEmiInfo: price[0].addInfo
            },
            luxury: {
                regularPrice: price[1].regular,
                discountedPrice: price[1].discount,
                pricingInfo: price[1].info,
                emiStartsFrom: price[1].emi,
                additionalEmiInfo: price[1].addInfo
            },
            premium: {
                regularPrice: price[2].regular,
                discountedPrice: price[2].discount,
                pricingInfo: price[2].info,
                emiStartsFrom: price[2].emi,
                additionalEmiInfo: price[2].addInfo
            }
        };
    }

    return resp.send(data[0]);
});

router.post('/create', async (req, resp) => {
    // Add debug logging to help diagnose the 500 error
    // console.log('=== PACKAGE CREATE DEBUG ===');
    // console.log('Headers:', req.headers);
    // console.log('Body keys:', Object.keys(req.body || {}));
    // console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    if (req.body && req.body.data) {
        try {
            const parsedData = JSON.parse(req.body.data);
            // console.log('Parsed data keys:', Object.keys(parsedData));
            // console.log('Title:', parsedData.title);
            // console.log('Status:', parsedData.status);

            // Debug HTML content fields
            // console.log('=== HTML CONTENT DEBUG ===');
            // console.log('Overview length:', parsedData.overview ? parsedData.overview.length : 0);
            // console.log('Overview preview:', parsedData.overview ? parsedData.overview.substring(0, 100) + '...' : 'Empty');
            // console.log('AdditionalInfo length:', parsedData.additionalInfo ? parsedData.additionalInfo.length : 0);
            // console.log('AdditionalInfo preview:', parsedData.additionalInfo ? parsedData.additionalInfo.substring(0, 100) + '...' : 'Empty');

            // Check itinerary for HTML content
            if (parsedData.itinerary) {
                try {
                    const itinerary = JSON.parse(parsedData.itinerary);
                    // console.log('Itinerary items:', itinerary.length);
                    itinerary.forEach((day, index) => {
                        if (day.description) {
                            // console.log(`Day ${index + 1} description length:`, day.description.length);
                        }
                    });
                } catch (e) {
                    console.log('Error parsing itinerary:', e.message);
                }
            }

            // Check FAQs for HTML content
            if (parsedData.faqs) {
                try {
                    const faqs = JSON.parse(parsedData.faqs);
                    // console.log('FAQ items:', faqs.length);
                    faqs.forEach((faq, index) => {
                        if (faq.answer) {
                            // console.log(`FAQ ${index + 1} answer length:`, faq.answer.length);
                        }
                    });
                } catch (e) {
                    console.log('Error parsing FAQs:', e.message);
                }
            }

        } catch (e) {
            console.log('Error parsing req.body.data:', e.message);
        }
    }
    // console.log('=== END DEBUG ===');

    try {
        // Check if request body and files exist
        if (!req.body || !req.body.data) {
            console.log('ERROR: Missing request data');
            return resp.status(400).send({ status: false, message: "Missing request data" });
        }

        // Note: We'll validate images after normalization since express-fileupload
        // handles single vs multiple files differently

        let { title, status, meta, time, slug, rating, minGroupSize, destinations, seasons, themes, includes, customization, marking, overview, journey, itinerary, inclusions, exclusions, additionalInfo, pricing, faqs } = JSON.parse(req.body.data);
        let files = req.files;
        const { admin } = req.headers;

        // Enhanced validation with specific error messages
        if (!admin) {
            return resp.status(401).send({ status: false, message: "Admin authentication required" });
        }

        // Check for missing required fields
        const requiredFields = { title, status, time, slug, rating, minGroupSize, overview, journey, itinerary, inclusions, exclusions, additionalInfo, pricing };
        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value || value === "") {
                return resp.status(400).send({ status: false, message: `Missing required field: ${field}` });
            }
        }

        // Validate HTML content fields
        try {
            // Check if overview contains HTML content and is not too large
            if (overview && overview.length > 65535) {
                return resp.status(400).send({ status: false, message: "Overview content is too large (max 65KB)" });
            }

            // Check if additionalInfo contains HTML content and is not too large
            if (additionalInfo && additionalInfo.length > 65535) {
                return resp.status(400).send({ status: false, message: "Additional information content is too large (max 65KB)" });
            }

            // Validate itinerary HTML content
            if (itinerary) {
                const parsedItinerary = JSON.parse(itinerary);
                for (let i = 0; i < parsedItinerary.length; i++) {
                    if (parsedItinerary[i].description && parsedItinerary[i].description.length > 65535) {
                        return resp.status(400).send({ status: false, message: `Day ${i + 1} description is too large (max 65KB)` });
                    }
                }
            }

            // Validate FAQ HTML content
            if (faqs) {
                const parsedFaqs = JSON.parse(faqs);
                for (let i = 0; i < parsedFaqs.length; i++) {
                    if (parsedFaqs[i].answer && parsedFaqs[i].answer.length > 65535) {
                        return resp.status(400).send({ status: false, message: `FAQ ${i + 1} answer is too large (max 65KB)` });
                    }
                }
            }
        } catch (error) {
            console.log('HTML content validation error:', error);
            return resp.status(400).send({ status: false, message: "Invalid HTML content format" });
        }

        // Check admin authorization
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (!isAdmin) {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }

        // Parse destinations safely
        try {
            destinations = JSON.parse(destinations);
        } catch (e) {
            return resp.status(400).send({ status: false, message: "Invalid destinations format" });
        }

        // Auto-set to draft if missing critical data
        if (!destinations || (destinations.length === 0) || (destinations[0] === "") || !includes || !itinerary || !files || !files.images) {
            status = "draft";
        }

        // Normalize images to array format (express-fileupload sends single file as object, multiple as array)
        let imageFiles = [];
        if (files.images) {
            if (Array.isArray(files.images)) {
                imageFiles = files.images;
            } else {
                imageFiles = [files.images]; // Single file case
            }
        }

        // Validate image count after normalizing
        if (!imageFiles || imageFiles.length === 0) {
            if (status === 'published') {
                return resp.status(400).send({ status: false, message: "At least one image is required for published tours" });
            } else {
                // For drafts, we can proceed without images
                console.log("Tour saved as draft without images");
            }
        }

        destinations = JSON.stringify(destinations);

        // Check slug uniqueness
        const ccheck = await package.existBySlug(slug);
        if (ccheck) slug = slug + "-" + parseInt(Math.random() * 10000000) + 1;

        // Create combined data entries with error handling
        const combinedResults = {};
        const combinedFields = { time, destinations, seasons, meta, journey, itinerary, inclusions, exclusions, pricing, faqs, themes, includes };

        for (const [field, data] of Object.entries(combinedFields)) {
            try {
                const result = await combined.create({ type: field, data: data });
                if (!result || !result.insertId) {
                    throw new Error(`Failed to create ${field} data`);
                }
                combinedResults[field] = result.insertId;
            } catch (error) {
                console.log(`Error creating ${field}:`, error);
                return resp.status(500).send({ status: false, message: `Failed to process ${field} data: ${error.message}` });
            }
        }

        // Process images with error handling
        let images = [];
        try {
            if (imageFiles && imageFiles.length > 0) {
                for (let i = 0; i < imageFiles.length; i++) {
                    const imageResult = await image.convertAndUpload(imageFiles[i], "package");
                    if (imageResult && imageResult.insertId) {
                        images.push(imageResult.insertId);
                    } else {
                        throw new Error(`Failed to upload image ${i + 1}: ${imageResult ? imageResult.message : 'Unknown error'}`);
                    }
                }
            }
        } catch (error) {
            console.log("Error processing images:", error);
            return resp.status(500).send({ status: false, message: `Image processing failed: ${error.message}` });
        }

        if (!images || images.length === 0) {
            if (status === 'published') {
                return resp.status(400).send({ status: false, message: "At least one image is required for published tours" });
            } else {
                // For drafts, we can proceed without images
                console.log("Tour saved as draft without images");
            }
        }

        images = JSON.stringify(images);

        // Create package with error handling
        try {
            const packageData = {
                title: title,
                slug: slug,
                time: combinedResults.time,
                rating: rating,
                maxGroup: minGroupSize,
                destinations: combinedResults.destinations,
                seasons: combinedResults.seasons,
                customize: customization,
                marking: marking,
                themes: combinedResults.themes,
                includes: combinedResults.includes,
                images: images,
                meta: combinedResults.meta,
                overview: overview,
                journey: combinedResults.journey,
                itinerary: combinedResults.itinerary,
                inclusions: combinedResults.inclusions,
                exclusions: combinedResults.exclusions,
                additionalInfo: additionalInfo,
                price: combinedResults.pricing,
                faq: combinedResults.faqs,
                status: status
            };

            const package1 = await package.create(packageData);

            if (!package1 || !package1.insertId) {
                throw new Error("Failed to create package record");
            }

            return resp.send({ status: true, message: "Package Added Successfully", id: package1.insertId });
        } catch (error) {
            console.log("Error creating package:", error);
            return resp.status(500).send({ status: false, message: `Package creation failed: ${error.message}` });
        }

    } catch (error) {
        console.log("Error in add package:", error);
        return resp.status(500).send({ status: false, message: `Internal Server Error: ${error.message}` });
    }
})

router.post("/check", async (req, resp) => {
    let { slug } = req.body;
    let { admin } = req.headers;
    if (!admin || !slug || slug === "") return resp.status(400).send({ status: false, message: "Bad Request" });

    if (await user.isRole(admin, ["admin", "subadmin"])) {
        const ccheck = await package.existBySlug(slug);
        if (ccheck) return resp.send({ status: true, message: "Package Already Exists" });
        return resp.send({ status: false, message: "Package Does't Exists" });
    }
    return resp.status(401).send({ status: false, message: "Access Denied!" });
})

router.post("/delete", async (req, resp) => {
    let { id } = req.body;
    let { admin } = req.headers;
    if (!admin || !id || id === "") return resp.status(400).send({ status: false, message: "Bad Request" });

    if (await user.isRole(admin, ["admin", "subadmin"])) {
        const ccheck = await package.existById(id);
        if (!ccheck) return resp.send({ status: false, message: "Package Does't Exists" });
        const deleted = await package.delte(id);
        if (deleted) return resp.send({ status: true, message: "Package Deleted" });
        return resp.send({ status: false, message: "Internal Server Error" });
    }
    return resp.status(401).send({ status: false, message: "Access Denied!" });
})

router.post('/update/:packageUrl', async (req, resp) => {
    try {
        let { packageUrl } = req.params;
        let requestData = JSON.parse(req.body.data);
        let { title, status, meta, time, slug, rating, minGroupSize, destinations, seasons, themes, includes, customization, marking, overview, journey, itinerary, inclusions, exclusions, additionalInfo, pricing, faqs, existingImages } = requestData;
        let uploads = req.files;
        const { admin } = req.headers;

        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (!isAdmin) return resp.status(401).send({ status: false, message: "Access Denied!" })
        let desti = JSON.parse(destinations);

        let data = {};
        data.status = status;

        // Normalize images to array format (express-fileupload sends single file as object, multiple as array)
        let imageFiles = [];
        if (uploads && uploads.images) {
            if (Array.isArray(uploads.images)) {
                imageFiles = uploads.images;
            } else {
                imageFiles = [uploads.images]; // Single file case
            }
        }

        // Check if we have enough data for published status
        if (!desti || (desti.length === 0) || (desti[0] === "") || !includes || !itinerary || !journey || (journey.length === 0)) {
            data.status = "draft";
        }

        // For published tours, ensure we have at least one image (existing or new)
        if (status === 'published') {
            const hasExistingImages = existingImages && existingImages.length > 0;
            const hasNewImages = imageFiles && imageFiles.length > 0;
            if (!hasExistingImages && !hasNewImages) {
                return resp.status(400).send({ status: false, message: "At least one image is required for published tours" });
            }
        }

        if (!packageUrl || !admin) return resp.status(400).send({ status: false, message: "Bad Request" });
        if (!(await package.existBySlug(packageUrl))) return resp.status(404).send({ status: false, message: "Package Not Found" });

        let package1 = await package.findBySlug(packageUrl);

        if (title) {
            if (title !== package1.title) data.title = title;
        }

        if (meta) {
            const dta = (await combined.findById(package1.meta))[0].data;
            if (meta !== dta) {
                let insertId = (await combined.update(package1.meta, { data: meta })).insertId;
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (time) {
            const dta = (await combined.findById(package1.time))[0].data;
            if (time !== dta) {
                let insertId = (await combined.update(package1.time, { data: time })).insertId;
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (slug) {
            if (package1.slug !== slug) {
                const ccheck = await package.existBySlug(slug);
                if (ccheck) slug = slug + "-" + parseInt(Math.random() * 10000000) + 1;
                data.slug = slug;
            }
        }
        if (rating) {
            if (rating !== package1.rating) data.rating = rating;
        }
        if (minGroupSize) {
            if (package1.maxGroup !== minGroupSize) data.maxGroup = minGroupSize;
        }
        if (destinations) {
            const dta = (await combined.findById(package1.destinations))[0].data;
            if (destinations !== dta) {
                let insertId = await combined.update(package1.destinations, { data: destinations })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (seasons) {
            const dta = (await combined.findById(package1.seasons))[0].data;
            if (seasons !== dta) {
                let insertId = await combined.update(package1.seasons, { data: seasons })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (themes) {
            const dta = (await combined.findById(package1.themes))[0].data;
            if (themes !== dta) {
                let insertId = await combined.update(package1.themes, { data: themes })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (includes) {
            const dta = (await combined.findById(package1.includes))[0].data;
            if (includes !== dta) {
                let insertId = await combined.update(package1.includes, { data: includes })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (customization) {
            if (package1.customize !== customization) data.customize = customization;
        }
        if (marking) {
            if (package1.marking !== marking) data.marking = marking;
        }
        if (overview) {
            if (package1.overview !== overview) data.overview = overview;
        }
        if (journey) {
            const dta = (await combined.findById(package1.journey))[0].data;
            if (journey !== dta) {
                let insertId = await combined.update(package1.journey, { data: journey })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (itinerary) {
            const dta = (await combined.findById(package1.itinerary))[0].data;
            if (itinerary !== dta) {
                let insertId = await combined.update(package1.itinerary, { data: itinerary })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (inclusions) {
            const dta = (await combined.findById(package1.inclusions))[0].data;
            if (inclusions !== dta) {
                let insertId = await combined.update(package1.inclusions, { data: inclusions })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (exclusions) {
            const dta = (await combined.findById(package1.exclusions))[0].data;
            if (exclusions !== dta) {
                let insertId = await combined.update(package1.exclusions, { data: exclusions })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (additionalInfo) {
            if (package1.additionalInfo !== additionalInfo) data.additionalInfo = additionalInfo;
        }
        if (pricing) {
            const dta = (await combined.findById(package1.price))[0].data;
            if (pricing !== dta) {
                let insertId = await combined.update(package1.price, { data: pricing })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }
        if (faqs) {
            const dta = (await combined.findById(package1.faq))[0].data;
            if (faqs !== dta) {
                let insertId = await combined.update(package1.faq, { data: faqs })
                if (!insertId) return resp.status(500).send({ status: false, message: "Internal Server Error" });
            };
        }

        if (existingImages || imageFiles) {
            let imageArr = [];
            if (package1.images && package1.images.length > 0) {
                let existingImages = JSON.parse(package1.images);
                for (let i = 0; i < existingImages.length; i++) {
                    let img = await image.findById(existingImages[i]);
                    if (img) {
                        imageArr.push(img.file_path);
                    }
                }
            }
            if (existingImages !== imageArr) {
                let imagesId = [];
                if (existingImages && existingImages.length > 0) {
                    for (let i = 0; i < existingImages.length; i++) {
                        let imgId = await image.getidByPath(existingImages[i]);
                        if (imgId) {
                            imagesId.push(imgId);
                        }
                    }
                }
                if (imageFiles && imageFiles.length > 0) {
                    for (let i = 0; i < imageFiles.length; i++) {
                        try {
                            const imageResult = await image.convertAndUpload(imageFiles[i], "package");
                            if (imageResult && imageResult.insertId) {
                                imagesId.push(imageResult.insertId);
                            }
                        } catch (error) {
                            console.log(`Error uploading image ${i + 1}:`, error);
                            return resp.status(500).send({ status: false, message: `Image processing failed: ${error.message}` });
                        }
                    }
                }

                // Only require images for published tours
                if (status === 'published' && (!imagesId || imagesId.length === 0)) {
                    return resp.status(400).send({ status: false, message: "At least one image is required for published tours" });
                }

                data.images = JSON.stringify(imagesId);
            };
        }

        if (!data) return resp.status(500).send({ status: true, message: "Package Updated" });

        if (Object.entries(data).length !== 0) {
            await package.update(data, { slug: packageUrl });
        }
        return resp.send({ status: true, message: "Package Updated" });
    } catch (error) {
        console.log("Error in update package:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.get("/load", async (req, resp) => {
    let data = {};
    data.theme = await theme.findAll();
    data.destination = await destination.findAll();

    let destinationsData = [];
    for (let i = 0; i < data.destination.length; i++) {
        let type = JSON.parse(data.destination[i].type);
        if (type.category === '' && type.from === '') {
            destinationsData.push(data.destination[i]);
        }
    }

    data.destination = destinationsData;

    data.include = await include.findAll();
    data.season = await season.findAll();
    resp.send(data);
})

router.get("/public/:slug", async (req, resp) => {
    let slug = req.params.slug;
    if (!(await package.existBySlug(slug))) return resp.send({ status: false, message: "Package Not Found" });
    slug = await package.findBySlug(slug);
    if (!slug || slug.length <= 0) return resp.send({ status: false, message: "Package Not Found" });
    let data = [];
    data.push(slug);

    for (let i = 0; i < data.length; i++) {
        let time = JSON.parse((await combined.findById(data[i].time))[0].data);
        let destinations = JSON.parse((await combined.findById(data[i].destinations))[0].data);
        let seasons = JSON.parse((await combined.findById(data[i].seasons))[0].data);
        let themes = JSON.parse((await combined.findById(data[i].themes))[0].data);
        let meta = JSON.parse((await combined.findById(data[i].meta))[0].data);
        let journey = JSON.parse((await combined.findById(data[i].journey))[0].data);
        let itinerary = JSON.parse((await combined.findById(data[i].itinerary))[0].data);

        for (let j = 0; j < itinerary.length; j++) {
            for (let k = 0; k < itinerary[j].includes.length; k++) {
                let inc = await include.query(`SELECT include.id, include.name, image.file_path FROM include inner join image on include.image = image.id WHERE include.name = '${itinerary[j].includes[k]}'`);
                itinerary[j].includes[k] = inc[0];
            }
        }

        let inclusions = JSON.parse((await combined.findById(data[i].inclusions))[0].data);
        let exclusions = JSON.parse((await combined.findById(data[i].exclusions))[0].data);
        let price = JSON.parse((await combined.findById(data[i].price))[0].data);
        let faq = JSON.parse((await combined.findById(data[i].faq))[0].data);
        let includes = JSON.parse((await combined.findById(data[i].includes))[0].data);

        // console.log(await include.findAll());

        for (let j = 0; j < includes.length; j++) {
            let inc = await include.query(`SELECT include.id, include.name, image.file_path FROM include inner join image on include.image = image.id WHERE include.name = '${includes[j]}'`);
            includes[j] = inc[0];
        }

        let images = JSON.parse(data[i].images);
        for (let j = 0; j < images.length; j++) {
            images[j] = (await image.findById(images[j])).file_path;
        }

        if (typeof destinations === "object") {
            for (let j = 0; j < destinations.length; j++) {
                const destResult = await destination.findAllWhere({ id: destinations[j] });
                destinations[j] = destResult[0];
            }
        }

        data[i].days = time.days;
        data[i].nights = time.nights;

        data[i].destinations = destinations;
        data[i].seasons = seasons;

        data[i].metaTitle = meta.title;
        data[i].metaTags = meta.tags;
        data[i].extraMetaTags = meta.extraTags;

        data[i].journey = journey;
        data[i].itinerary = itinerary;
        data[i].inclusions = inclusions;
        data[i].exclusions = exclusions;
        data[i].faqs = faq;

        data[i].images = images;
        data[i].customization = data[i].customize;
        data[i].maxGroupSize = data[i].maxGroup;
        data[i].themes = themes;
        data[i].includes = includes;

        data[i].pricing = {
            deluxe: {
                regularPrice: price[0].regular,
                discountedPrice: price[0].discount,
                pricingInfo: price[0].info,
                emiStartsFrom: price[0].emi,
                additionalEmiInfo: price[0].addInfo
            },
            luxury: {
                regularPrice: price[1].regular,
                discountedPrice: price[1].discount,
                pricingInfo: price[1].info,
                emiStartsFrom: price[1].emi,
                additionalEmiInfo: price[1].addInfo
            },
            premium: {
                regularPrice: price[2].regular,
                discountedPrice: price[2].discount,
                pricingInfo: price[2].info,
                emiStartsFrom: price[2].emi,
                additionalEmiInfo: price[2].addInfo
            }
        };
    }

    return resp.send(data[0]);
});

module.exports = router;

