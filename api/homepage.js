const express = require("express");
const router = express.Router();
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
const Season = require("../tables/season");
const season = new Season();
const Theme = require("../tables/theme");
const theme = new Theme();
const Blog = require("../tables/blog");
const blog = new Blog();
const Reviews = require("../tables/reviews");
const reviews = new Reviews();
const Include = require("../tables/include")
const include = new Include();

// Get homepage data
router.get("/get", async (req, resp) => {
    try {
        // Get existing homepage data
        const existingData = await combined.database.findWhere('combined', { type: "homepage" });

        if (existingData.length === 0) {
            // Return default structure if no data exists
            return resp.send({
                meta: {
                    title: "",
                    description: "",
                    extraTags: ""
                },
                banners: [],
                popularDestinations: [],
                popularPackages: [],
                themes: [],
                seasons: [],
                domestic: {
                    destinations: [],
                    packages: []
                },
                international: {
                    destinations: [],
                    packages: []
                },
                reviews: [],
                aboutUs: {
                    stats: [],
                    content: ""
                },
                blogs: []
            });
        }

        const homepageData = JSON.parse(existingData[0].data);

        // Process images for banners
        if (homepageData.banners) {
            for (let banner of homepageData.banners) {
                if (banner.imageId) {
                    const imgData = await image.findById(banner.imageId);
                    banner.image = imgData ? imgData.file_path : '';
                }
            }
        }

        return resp.send(homepageData);
    } catch (error) {
        console.log("Error in homepage get:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Save homepage data
router.post("/save", async (req, resp) => {
    let { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (!isAdmin) return resp.status(401).send({ status: false, message: "Access Denied!" });

        const {
            meta,
            banners,
            popularDestinations,
            popularPackages,
            themes,
            seasons,
            domestic,
            international,
            reviews,
            aboutUs,
            blogs
        } = JSON.parse(req.body.data);

        // Process banner images
        let processedBanners = [];
        if (req.files && req.files.bannerImages) {
            const bannerImages = Array.isArray(req.files.bannerImages)
                ? req.files.bannerImages
                : [req.files.bannerImages];

            for (let i = 0; i < banners.length; i++) {
                let banner = { ...banners[i] };

                // If new image uploaded for this banner
                if (bannerImages[i]) {
                    try {
                        const imageResult = await image.convertAndUpload(bannerImages[i], "homepage");
                        if (imageResult && imageResult.insertId) {
                            banner.imageId = imageResult.insertId;
                        }
                    } catch (error) {
                        console.log(`Error uploading banner image ${i}:`, error);
                    }
                }

                processedBanners.push(banner);
            }
        } else {
            processedBanners = banners;
        }

        const homepageData = {
            meta,
            banners: processedBanners,
            popularDestinations,
            popularPackages,
            themes,
            seasons,
            domestic,
            international,
            reviews,
            aboutUs,
            blogs,
            lastUpdated: new Date().toISOString()
        };

        // Check if homepage data already exists
        const existingData = await combined.database.findWhere('combined', { type: "homepage" });

        if (existingData.length > 0) {
            // Update existing
            await combined.update(existingData[0].id, { data: JSON.stringify(homepageData) });
        } else {
            // Create new
            await combined.create({
                type: "homepage",
                data: JSON.stringify(homepageData)
            });
        }

        return resp.send({ status: true, message: "Homepage updated successfully" });
    } catch (error) {
        console.log("Error in homepage save:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Get load data (destinations, packages, themes, seasons, blogs, reviews)
router.get("/load", async (req, resp) => {
    try {
        const [
            destinations,
            packages,
            themes,
            seasons,
            blogs,
            reviewsData
        ] = await Promise.all([
            destination.findAll(),
            package.findAll(),
            theme.findAll(),
            season.findAll(),
            blog.findAll(),
            reviews.findAll()
        ]);

        // Format destinations
        const formattedDestinations = [];
        destinations.map(dest => {
            let type = JSON.parse(dest.type);

            if (type.category === "" && type.from === "") {
                formattedDestinations.push({
                    value: dest.id,
                    type: JSON.parse(dest.type).name
                });
            }
        });

        // Format packages
        const formattedPackages = packages.map(pkg => ({
            value: pkg.id,
            label: pkg.title
        }));

        // Format themes
        const formattedThemes = themes.map(t => ({
            value: t.id,
            label: t.name
        }));

        // Format seasons
        const formattedSeasons = seasons.map(s => ({
            value: s.id,
            label: s.name
        }));

        // Format blogs
        const formattedBlogs = blogs.map(b => ({
            value: b.id,
            label: b.title
        }));

        // Format reviews (all text reviews for admin selection)
        const formattedReviews = reviewsData
            .filter(r => r.review_type === 'text')
            .map(r => ({
                value: r.id,
                label: `${r.name} - ${r.comment ? r.comment.substring(0, 50) : ''}...`,
                name: r.name,
                review: r.comment,
                rating: r.rating,
                status: r.status
            }));

        return resp.send({
            destinations: formattedDestinations,
            packages: formattedPackages,
            themes: formattedThemes,
            seasons: formattedSeasons,
            blogs: formattedBlogs,
            reviews: formattedReviews
        });
    } catch (error) {
        console.log("Error in homepage load:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

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

// Public API endpoint for main website (no authentication required)
router.get("/public", async (req, resp) => {
    try {
        // Get homepage data
        const existingData = await combined.findAllWhere({ type: "homepage" });

        if (existingData.length === 0) {
            return resp.send({
                meta: {
                    title: "TripKnock - Your Travel Partner",
                    description: "Discover amazing destinations and packages with TripKnock",
                    extraTags: ""
                },
                banners: [],
                popularDestinations: [],
                popularPackages: [],
                themes: [],
                seasons: [],
                domestic: {
                    destinations: [],
                    packages: []
                },
                international: {
                    destinations: [],
                    packages: []
                },
                reviews: [],
                aboutUs: {
                    stats: [],
                    content: ""
                },
                blogs: []
            });
        }

        const homepageData = JSON.parse(existingData[0].data);

        // Process images for banners
        if (homepageData.banners) {
            for (let banner of homepageData.banners) {
                if (banner.imageId) {
                    const imgData = await image.findById(banner.imageId);
                    banner.image = imgData ? `/uploads/${imgData.file_path}` : '';
                }
            }
        }

        if (homepageData.popularPackages) {
            let pkgedData = [];
            for (let pkg of homepageData.popularPackages) {
                if (pkg.value) {
                    const pkgData = (await package.findById(pkg.value))[0];
                    if (pkgData) {
                        pkgedData.push(await getFullPackageDetails(pkgData));
                    }
                }
            }

            homepageData.popularPackages = pkgedData;
        }

        // console.log(homepageData)

        // Fetch full data for selected items
        const enrichedData = await enrichHomepageData(homepageData);

        return resp.send(enrichedData);
    } catch (error) {
        console.log("Error in homepage public get:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

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

// Helper function to enrich homepage data with full details
async function enrichHomepageData(homepageData) {
    try {
        // Enrich destinations
        let popularDestinations = homepageData.popularDestinations;
        // console.log(popularDestinations);

        let allDestinations = [];

        for (let i = 0; i < popularDestinations.length; i++) {
            let destinationData = await destination.findAllWhere({ id: popularDestinations[i].value });

            let images = [];

            let count = 0;
            let slugForDestination = '';
            for (let j = 0; j < destinationData.length; j++) {
                let destinationDataNew = await destination.findAllWhere({ name: destinationData[j].name });

                for (let k = 0; k < destinationDataNew.length; k++) {
                    let currentType = (JSON.parse(destinationDataNew[k].type));
                    if (currentType.category === "" && currentType.from === "") {
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
            count = (await getPackagesCategory(destinationType.name, '')).totalPackages;

            allDestinations.push({
                name: destinationData[0].name,
                slug: slugForDestination,
                images: images,
                count: count || 0
            });
        }

        popularDestinations = allDestinations;

        // Enrich packages
        const popularPackages = homepageData.popularPackages || [];

        // Enrich themes with packages
        const themes = await Promise.all(
            (homepageData.themes || []).map(async (themeItem) => {
                if (!themeItem.theme) return null;

                const fullTheme = await theme.find({ id: themeItem.theme.value });
                if (fullTheme.length === 0) return null;

                const themeData = fullTheme[0];
                const themePackages = await Promise.all(
                    (themeItem.packages || []).map(async (pkg) => {
                        const fullPkg = await package.findAllWhere({ id: pkg.value });
                        if (fullPkg.length > 0) {
                            const pkgData = fullPkg[0];
                            let images = [];
                            try {
                                const imageIds = JSON.parse(pkgData.images);
                                if (imageIds.length > 0) {
                                    const img = await image.findById(imageIds[0]);
                                    images = img ? [`/uploads/${img.file_path}`] : [];
                                }
                            } catch (e) {
                                images = [];
                            }

                            return {
                                id: pkgData.id,
                                title: pkgData.title,
                                slug: pkgData.slug,
                                images: images,
                                rating: pkgData.rating
                            };
                        }
                        return null;
                    })
                );

                return {
                    id: themeData.id,
                    name: themeData.name,
                    slug: themeData.slug,
                    packages: themePackages.filter(pkg => pkg !== null)
                };
            })
        );

        // Enrich domestic destinations and packages
        const domesticDestinations = await Promise.all(
            (homepageData.domestic?.destinations || []).map(async (dest) => {
                const fullDest = await destination.findAllWhere({ id: dest.value });
                if (fullDest.length > 0) {
                    const destData = fullDest[0];
                    let images = [];
                    try {
                        const imageIds = JSON.parse(destData.images);
                        if (imageIds.length > 0) {
                            const img = await image.findById(imageIds[0]);
                            images = img ? [`/uploads/${img.file_path}`] : [];
                        }
                    } catch (e) {
                        images = [];
                    }

                    return {
                        id: destData.id,
                        name: destData.name,
                        title: destData.title,
                        slug: destData.slug,
                        images: images,
                        country: destData.country
                    };
                }
                return null;
            })
        );

        const domesticPackages = await Promise.all(
            (homepageData.domestic?.packages || []).map(async (pkg) => {
                const fullPkg = await package.findAllWhere({ id: pkg.value });
                if (fullPkg.length > 0) {
                    const pkgData = fullPkg[0];
                    let images = [];
                    try {
                        const imageIds = JSON.parse(pkgData.images);
                        if (imageIds.length > 0) {
                            const img = await image.findById(imageIds[0]);
                            images = img ? [`/uploads/${img.file_path}`] : [];
                        }
                    } catch (e) {
                        images = [];
                    }

                    return {
                        id: pkgData.id,
                        title: pkgData.title,
                        slug: pkgData.slug,
                        images: images,
                        rating: pkgData.rating
                    };
                }
                return null;
            })
        );

        // Enrich international destinations and packages
        const internationalDestinations = await Promise.all(
            (homepageData.international?.destinations || []).map(async (dest) => {
                const fullDest = await destination.findAllWhere({ id: dest.value });
                if (fullDest.length > 0) {
                    const destData = fullDest[0];
                    let images = [];
                    try {
                        const imageIds = JSON.parse(destData.images);
                        if (imageIds.length > 0) {
                            const img = await image.findById(imageIds[0]);
                            images = img ? [`/uploads/${img.file_path}`] : [];
                        }
                    } catch (e) {
                        images = [];
                    }

                    return {
                        id: destData.id,
                        name: destData.name,
                        title: destData.title,
                        slug: destData.slug,
                        images: images,
                        country: destData.country
                    };
                }
                return null;
            })
        );

        const internationalPackages = await Promise.all(
            (homepageData.international?.packages || []).map(async (pkg) => {
                const fullPkg = await package.findAllWhere({ id: pkg.value });
                if (fullPkg.length > 0) {
                    const pkgData = fullPkg[0];
                    let images = [];
                    try {
                        const imageIds = JSON.parse(pkgData.images);
                        if (imageIds.length > 0) {
                            const img = await image.findById(imageIds[0]);
                            images = img ? [`/uploads/${img.file_path}`] : [];
                        }
                    } catch (e) {
                        images = [];
                    }

                    return {
                        id: pkgData.id,
                        title: pkgData.title,
                        slug: pkgData.slug,
                        images: images,
                        rating: pkgData.rating
                    };
                }
                return null;
            })
        );

        // Enrich reviews
        const enrichedReviews = await Promise.all(
            (homepageData.reviews || []).map(async (review) => {
                const fullReview = await reviews.findAllWhere({ id: review.value });
                if (fullReview.length > 0) {
                    const reviewData = fullReview[0];
                    return {
                        id: reviewData.id,
                        name: reviewData.name,
                        designation: reviewData.designation,
                        destination: reviewData.destination,
                        rating: reviewData.rating,
                        comment: reviewData.comment,
                        image_url: reviewData.image_url,
                        review_images: (() => {
                            if (!reviewData.review_images) return [];
                            try {
                                if (typeof reviewData.review_images === 'string') {
                                    return JSON.parse(reviewData.review_images);
                                } else if (Array.isArray(reviewData.review_images)) {
                                    return reviewData.review_images;
                                }
                                return [];
                            } catch (e) {
                                console.log('Error parsing review_images in homepage:', e);
                                return [];
                            }
                        })()
                    };
                }
                return null;
            })
        );

        // Enrich blogs
        const enrichedBlogs = await Promise.all(
            (homepageData.blogs || []).map(async (blogItem) => {
                const fullBlog = await blog.findAllWhere({ id: blogItem.value });
                if (fullBlog.length > 0) {
                    const blogData = fullBlog[0];
                    let featuredImage = '';
                    try {
                        if (blogData.featured_image) {
                            const img = await image.findById(blogData.featured_image);
                            featuredImage = img ? `/uploads/${img.file_path}` : '';
                        }
                    } catch (e) {
                        featuredImage = '';
                    }

                    return {
                        id: blogData.id,
                        title: blogData.title,
                        slug: blogData.slug,
                        content: blogData.content,
                        featured_image: featuredImage,
                        created_at: blogData.created_at
                    };
                }
                return null;
            })
        );

        // Enrich seasons
        const enrichedSeasons = await Promise.all(
            (homepageData.seasons || []).map(async (seasonItem) => {
                const seasonData = await season.findById(seasonItem.value);
                if (seasonData) {
                    let seasonImage = '';
                    try {
                        if (seasonData.image) {
                            const img = await image.findById(seasonData.image);
                            seasonImage = img ? `/uploads/${img.file_path}` : '';
                        }
                    } catch (e) {
                        seasonImage = '';
                    }

                    return {
                        id: seasonData.id,
                        name: seasonData.name,
                        slug: seasonData.slug,
                        image: seasonImage
                    };
                }
                return null;
            })
        );

        return {
            meta: homepageData.meta || {},
            banners: homepageData.banners || [],
            popularDestinations: popularDestinations.filter(item => item !== null),
            popularPackages: popularPackages,
            themes: themes.filter(item => item !== null),
            seasons: enrichedSeasons.filter(item => item !== null),
            domestic: {
                destinations: domesticDestinations.filter(item => item !== null),
                packages: domesticPackages.filter(item => item !== null)
            },
            international: {
                destinations: internationalDestinations.filter(item => item !== null),
                packages: internationalPackages.filter(item => item !== null)
            },
            reviews: enrichedReviews.filter(item => item !== null),
            aboutUs: homepageData.aboutUs || { stats: [], content: '' },
            blogs: enrichedBlogs.filter(item => item !== null)
        };
    } catch (error) {
        console.log("Error enriching homepage data:", error);
        return homepageData;
    }
}

module.exports = router;