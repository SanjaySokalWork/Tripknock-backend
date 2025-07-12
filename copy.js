const connection = require('./database/connection');

const uuidv4 = require('uuid').v4;

let reviews = [];

connection.connection.query('SELECT * FROM reviews where `review_type` = "text"', (err, results) => {
    if (err) {
        console.error('Error fetching reviews:', err);
        return;
    }
    // console.log('Reviews:', results);
    reviews = results;
    // console.log(reviews);

    for (var i = 0; i < reviews.length; i++) {
        console.log(reviews[i]);

        // connection.connection.query('INSERT INTO `reviews` (id, name, designation, rating, comment, image_url, image_id, review_images, video_url, thumbnail_url, thumbnail_id, destination, review_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [uuidv4(), reviews[i].name, reviews[i].designation, reviews[i].rating, reviews[i].comment, reviews[i].image_url, reviews[i].image_id, reviews[i].review_images, reviews[i].video_url, reviews[i].thumbnail_url, reviews[i].thumbnail_id, reviews[i].destination, reviews[i].review_type], (err, results) => {
        //     if (err) {
        //         console.error('Error inserting review:', err);
        //         return;
        //     }
        //     console.log('Review inserted:', results);
        // });
    }
});