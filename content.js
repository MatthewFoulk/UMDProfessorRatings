
// UMD Schedule of Classes
const contentContainerClass = ".soc-content-container"
const tba = "Instructor: TBA"; // PLaceholder for professor that hasn't been assigned
const instructorHidderClasses = '.hidden.section-deliveryFilter' // Element that stops instructor from being displayed
const sectInstContClass = ".section-instructors-container"; // Container holding the instructor name
const sectInstClass = ".section-instructor" // Span holding instructor name

// PlanetTerp
const baseApiCallPlanetTerp = 'https://planetterp.com/api/v1/professor?name=';
const endingApiCallPlanetTerp = '&reviews=true';
const ratingPlanetTerpClass = ".rating-planet-terp"; // Class for planet terp rating objects
const logoPlanetTerpPath = '/images/PlanetTerpLogo.png'; // Goes next to rating
const planetTerpBlue = "#0099FC"; // Color of planetTerps logo

// RateMyProfessor
const baseApiCallRateMyProfessor = 'https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=1&wt=json&q=';
const endingApiCallRateMyProfessor = '+AND+schoolid_s%3A1270&defType=edismax&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+siteName=rmp&rows=1&start=0&fl=pk_id+averageratingscore_rf'
const ratingRateMyProfessorClass = ".rating-rate-my-professor"; // Class for RMP rating objects
const logoRateMyProfessorPath = 'images/RateMyProfessorLogo.png'; // Logo next to rating
const rateMyProfessorBlue = '#0021FF'; //Color of RMP logo

// CORS proxy
const proxy = "https://cryptic-cliffs-23292.herokuapp.com/";


var profNames = new Set(); // Store all professor names on page
var profInfo = new Object(); // Store professor ratings, links, slug, etc
var pk_id_Name = new Object(); // Key val pair (pk_id: prof_name)

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

    /* Get all of the seperate parts of professor's name
        (typically [first, last]) */
    var names = name.split(" ");

    /* Build api call url */
    var apiCall = baseApiCallPlanetTerp;
    var firstName = true;

    for (namePart of names){

        /* No space before first name */
        if (firstName){
            apiCall += namePart;
            firstName = false;
        
        /* Add space before any additional names */
        } else {
            apiCall += "%20" + namePart;
        }
    }

    /* Add api call ending to get reviews */
    apiCall += endingApiCallPlanetTerp;

    /* Fetch professor ratings from Planet Terp */
    $.ajax({
        url: proxy + apiCall,
        type: "GET",
        success: (result) => {
            console.log(result);
            profInfo[name]['pt'] = new Object;
            var totalReviews = result["reviews"].length;
            /* No reviews */
            if (totalReviews == 0){
                profInfo[name]['pt'] = null;

            /* Reviews */
            } else {
                var averageRating = 0;
                for (review of result["reviews"]) {
                    averageRating += review["rating"] / totalReviews;
                }
                /* Adding rating to professorRatings */
                profInfo[name]['pt']['rating'] = averageRating;
                profInfo[name]['pt']['url'] = `https://planetterp.com/professor/${result['slug']}`;
            }
        },
        error: (error) => {
            console.log(error)
            /* Couldn't find professor */
            profInfo[name]['pt'] = null;
        },
    });
}

function getInfoRMP(name){

    /* Split into first name and last name */
    var names = name.split(" ");
    var firstName = names[0];
    var lastName = names[1];

    /* Build api call */
    apiCall = baseApiCallRateMyProfessor 
    apiCall += lastName + '+' + firstName + endingApiCallRateMyProfessor

    /* Fetch professor ratings from Planet Terp */
    $.ajax({
        url: proxy + apiCall,
        success: (result) => {
            profInfo[name]['rmp'] = new Object;
            result = JSON.parse(result);
            console.log(result)

            /* Couldn't find professor */
            if (result['response']['docs'].length == 0){
                profInfo[name]['rmp'] = null;

            /* Adding rating to professorRatings */
            } else {
                var pk_id = result['response']['docs'][0]['pk_id'];
                pk_id_Name[pk_id] = name;
                profInfo[name]['rmp']['rating'] = result['response']['docs'][0]['averageratingscore_rf'];
                profInfo[name]['rmp']['url'] = `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${pk_id}&showMyProfs=true`;
            }
        },
        error: (error) => {
            console.log(error)
            /* Couldn't find professor */
            profInfo[name]['rmp'] = null;
        },
    });
}


function displayRatingPT(name){
    var sectionInfo = document.querySelectorAll(sectInstContClass);
    for (section of sectionInfo){

        var testName = section.querySelector(sectInstClass).innerText;

        /* Find sections with given professor name */
        if (name == testName){

            /* Verify rating not already added */
            if (section.querySelectorAll(ratingPlanetTerpClass).length == 0){

                if (! (profInfo[name]["pt"] == null)){
                    
                    /* Place an image next to rating with planet terp logo
                        also with link to professor reviews on planet terp */
                    var imageLink = document.createElement('a');
                    imageLink.href = profInfo[name]["pt"]['url'];
                    var image = document.createElement('img');
                    image.src = chrome.runtime.getURL(logoPlanetTerpPath);
                    image.style.marginLeft = "5px";
                    image.style.marginRight = "3px";
                    imageLink.appendChild(image);
                    section.appendChild(imageLink);
                    
                    /* Create display element with link to professor reviews */
                    var node = document.createElement("a");
                    var textNode = document.createTextNode(profInfo[name]["pt"]['rating'].toFixed(2));
                    node.appendChild(textNode);
                    node.href = profInfo[name]["pt"]['url'];
                    node.className = 'rating-planet-terp';
                    node.style.color = planetTerpBlue;
                    section.appendChild(node);
                }
            }
        }
    }
}

function displayRatingRMP(name){

    var sectionInfo = document.querySelectorAll(sectInstContClass);
    for (section of sectionInfo){

        var testName = section.querySelector(sectInstClass).innerText;

        /* Find sections with given professor name */
        if (name == testName){

            /* Verify rating not already added */
            if (section.querySelectorAll(ratingRateMyProfessorClass).length == 0){

                if (! (profInfo[name]["rmp"] == null)){
                    /* Place an image next to rating with planet terp logo
                        also with link to professor reviews on planet terp */
                    var imageLink = document.createElement('a');
                    imageLink.href = profInfo[name]['rmp']['url'];
                    var image = document.createElement('img');
                    image.src = chrome.runtime.getURL(logoRateMyProfessorPath);
                    image.style.marginLeft = "5px";
                    image.style.marginRight = "3px";
                    imageLink.appendChild(image);
                    section.appendChild(imageLink);
                    
                    /* Create display element with link to professor reviews */
                    var node = document.createElement("a");
                    var textNode = document.createTextNode(profInfo[name]["rmp"]['rating'].toFixed(2));
                    node.appendChild(textNode);
                    node.href = profInfo[name]["rmp"]['url'];
                    node.className = 'rating-rate-my-professor';
                    node.style.color = rateMyProfessorBlue;
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

    /* Fetch professor ratings for visible professors */
    for (name of profNames){
        if (!(name in profInfo)){
            profInfo[name] = new Object();
            getInfoPT(name);
            getInfoRMP(name);
        }
    }
})


/* Observe if professors become visible */
var observer = new MutationObserver( function(mutations){
    mutations.forEach( function(mutation) {
        if (mutation.attributeName !== 'style') return;
        if (mutation.target.className != "hidden section-deliveryFilter") return;
        
        /* Get professors visible on page */
        getProfessors();

        /* Fetch ratings if do not already have
            Display Ratings For professors already in
            profInfo */
        for (name of profNames){
            if (!(name in profInfo)){
                profInfo[name] = new Object();
                getInfoPT(name);
                getInfoRMP(name);
            } else {
                displayRatingPT(name);
                displayRatingRMP(name);
            }
        }
    });
});

/* Get all elements that control whether professors are visible */
var contentContainer = document.querySelector(contentContainerClass);

/* Monitor entire subtree for attribute changes */
observer.observe(contentContainer, { subtree: true, attributes: true });

$(document).ajaxComplete(function(event, xhr, settings) {
    
    /* PT responses */
    if ( ! (xhr['responseJSON'] == null)){
        var name = xhr['responseJSON']['name'];
        displayRatingPT(name);
        
    /* RMP responses */
    } else{
        var responseJSON = JSON.parse(xhr['responseText'])
        if (! (responseJSON['response']['docs'][0] == null)){
            var pk_id = responseJSON['response']['docs'][0]['pk_id'];
            var name = pk_id_Name[pk_id]
            displayRatingRMP(name);
        }
    }
})
