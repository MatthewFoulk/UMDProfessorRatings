

const tba = "Instructor: TBA"; // PLaceholder for professor that hasn't been assigned
const instructorHidderClasses = '.hidden.section-deliveryFilter' // Element that stops instructor from being displayed
const sectInstContClass = ".section-instructors-container"; // Container holding the instructor name
const sectInstClass = ".section-instructor" // Span holding instructor name
const ratingPlanetTerpClass = ".rating-planet-terp" // Class for planet terp rating objects
const logoPlanetTerpPath = '/images/PlanetTerpLogo.png'; // Goes next to rating
const planetTerpBlue = "#0099FC"; // Color of planetTerps logo

var profNames = new Set(); // Store all professor names on page
var profInfo = new Object(); // Store professor ratings, links, slug, etc

/**
 * Returns the names of all the professors on the page
 */
function getProfessors(){
    var profs = document.querySelectorAll(".section-instructor");
    for (prof of profs){
        var name = prof.innerText
        var twoNames = name.includes(","); // Checks if more than one professor is teaching

        if (twoNames){
            var names = name.split(',');
            var firstProf = names[0];
            var secondProf = names[1];

            profNames.add(firstProf);
            profNames.add(secondProf);
        } else {
            if (name != tba){
                profNames.add(name);
            }
        }
    }
}


/**
 * Fetch average rating for a given professor from Planet Terps API
 * and add to professorRatings
 * 
 * @param {*} name Professor's name (first last)
 */
async function getInfoPT(name){

    /* Divide full name into first and last names */
    var names = name.split(" ")
    var firstName = names[0];
    var lastName = names[1];

    /* Fetch professor ratings from Planet Terp */
    $.ajax({
        url: `https://cors-anywhere.herokuapp.com/https://api.planetterp.com/v1/professor?name=${firstName}%20${lastName}&reviews=true`,
        type: "GET",
        success: (result) => {
            var totalReviews = result["reviews"].length;
            var averageRating = 0;
            for (review of result["reviews"]) {
                averageRating += review["rating"] / totalReviews;
            }
            /* Adding rating to professorRatings */
            profInfo[name] = new Object();
            profInfo[name]['rating'] = averageRating;
            profInfo[name]['url'] = `https://planetterp.com/professor/${result['slug']}`;
        },
        error: (error) => {
            console.log(error)
            /* Couldn't find professor */
            profInfo[name]["rating"] = 0;
        },
    });
}


function displayRating(name){
    var sectionInfo = document.querySelectorAll(sectInstContClass);
    for (section of sectionInfo){

        var testName = section.querySelector(sectInstClass).innerText;

        /* Find sections with given professor name */
        if (name === testName){

            /* Verify rating not already added */
            if (section.querySelectorAll(ratingPlanetTerpClass).length == 0){
                console.log(section);
                console.log(section.querySelectorAll(ratingPlanetTerpClass));
                if (! (profInfo[name] === null)){
                    
                    /* Place an image next to rating with planet terp logo
                        also with link to professor reviews on planet terp */
                    var imageLink = document.createElement('a');
                    imageLink.href = profInfo[name]['url'];
                    var image = document.createElement('img');
                    image.src = chrome.runtime.getURL(logoPlanetTerpPath);
                    image.style.marginLeft = "5px";
                    image.style.marginRight = "3px";
                    imageLink.appendChild(image);
                    section.appendChild(imageLink);
                    
                    /* Create display element with link to professor reviews */
                    var node = document.createElement("a");
                    var textNode = document.createTextNode(profInfo[name]['rating'].toFixed(2));
                    node.appendChild(textNode);
                    node.href = profInfo[name]['url'];
                    node.className = 'rating-planet-terp';
                    node.style.color = planetTerpBlue;
                    section.appendChild(node);
                }
            }
        }
    }
}


/* Display ratings for all professors
    that are initially visiable */
$(document).ready(() => {

    /* Get professors visible on page */
    getProfessors();

    console.log(profNames);

    /* Fetch professor ratings for visible professors */
    for (name of profNames){
        if (!(name in profInfo)){
            getInfoPT(name);
        }
    }
})

/* Get all elements that control whether professors are visible */
var sectionBlockers = document.querySelectorAll(instructorHidderClasses);

/* Add an observer to each of the blockers waiting for
    professors to become visible */
for (blocker of sectionBlockers){
    var observer = new MutationObserver( function(mutations){
        mutations.forEach( function(mutation) {
            if (mutation.attributeName !== 'style') return;

            /* Get professors visible on page */
            getProfessors();

            console.log(profNames);

            /* Fetch ratings if do not already have
                Display Ratings For professors already in
                profInfo */
            for (name of profNames){
                if (!(name in profInfo)){
                    getInfoPT(name);
                } else {
                    displayRating(name);
                }
            }
        });
    });

    observer.observe(blocker, { attributes: true });
}

$(document).ajaxComplete(function(event, xhr, settings) {
    var name = xhr['responseJSON']['name'];
    displayRating(name);
    console.log(profInfo);
})