// UMD Schedule of Classes
const contentContainerClass = ".soc-content-container"
// PLaceholder for professor that hasn't been assigned
const instructorHidderClasses = '.hidden.section-deliveryFilter' // Element that stops instructor from being displayed
// Container holding the instructor name
// Span holding instructor name
// PlanetTerp
const baseApiCallPlanetTerp = 'https://planetterp.com/api/v1/professor?name=';
const ratingPlanetTerpClass = ".rating-planet-terp"; // Class for planet terp rating objects
const logoPlanetTerpPath = '/images/PlanetTerpLogo.png'; // Goes next to rating
const planetTerpBlue = "#0099FC"; // Color of planetTerp logo

// RateMyProfessor
const baseApiCallRateMyProfessor = 'https://www.ratemyprofessors.com/search/teachers?sid=U2Nob29sLTEyNzA=&query=';
const ratingRateMyProfessorClass = ".rating-rate-my-professor"; // Class for RMP rating objects
const logoRateMyProfessorPath = 'images/RateMyProfessorLogo.png'; // Logo next to rating
const rateMyProfessorBlue = '#0021FF'; //Color of RMP logo

// CORS proxy
const proxy = "https://nextjs-cors-anywhere.vercel.app/api?endpoint=";


const profInfo = {}; // Store professor ratings, links, slug, etc

/**
 * Returns the names of all the professors on the page
 */
function getProfessors() {
    const names = new Set();
    const profs = document.querySelectorAll(".section-instructor");

    for (const prof of profs) {
        // Support for n profs seperated by a comma
        prof.childNodes[0].textContent.split(',').filter((name) => name !== 'Instructor: TBA').forEach((name) => {
            names.add(name.trim());
        });
    }
    return names;
}


/**
 * Fetch average rating for a given professor from Planet Terps API
 * and add to professorRatings
 *
 * @param {*} name Professor's name (first last)
 */
async function getInfoPT(name) {
    // Encode the name for the api call using URLParameterEncoding
    /* Fetch professor ratings from Planet Terp */
    await fetch(baseApiCallPlanetTerp + encodeURIComponent(name)).then(r => r.json()).then((result) => {
        if ('error' in result && result['error'] === 'professor not found') {
            throw new Error('Professor not found');
        }
        profInfo[name]['pt'] = {};
        profInfo[name]['pt']['rating'] = result['average_rating'];
        profInfo[name]['pt']['url'] = `https://planetterp.com/professor/${result['slug']}`;

    }).catch((error) => {
        console.log('Could not get data about ' + name + ' from Planet Terp. ', error);
        /* Couldn't find professor */
        profInfo[name]['pt'] = null;
    });
}

async function getInfoRMP(name) {

    let apiCall = baseApiCallRateMyProfessor + encodeURIComponent(name);
    //set the request's mode to 'no-cors


    await fetch(proxy + apiCall).then(r => r.text()).then((result) => {
        // Find the index where "window.__RELAY_STORE__ = " appears, then get the json string between the next matching { and }
        const start = result.indexOf("window.__RELAY_STORE__ = ") + 25;
        const end = result.indexOf("};", start) + 1;
        const json = result.substring(start, end);
        const data = JSON.parse(json);
        // the data is store with random IDs as keys and objects as values. Iterate through object values until the value has a key firstname and lastname
        let possibleMatches = Object.values(data).filter((value) => 'firstName' in value && 'lastName' in value);

        profInfo[name]['rmp'] = {};
        if (possibleMatches.length === 0) {
            throw new Error('Professor not found');
        }
        profInfo[name]['rmp']['rating'] = possibleMatches[0]['avgRating'];
        profInfo[name]['rmp']['url'] = `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${possibleMatches[0]['legacyId']}`;

    }).catch((error) => {
        console.log('Could not get data about ' + name + ' from Rate My Professor. ', error);
        profInfo[name]['rmp'] = null;
    });
}

function displayRatingPT(name) {
    const sectionInfos = [...document.querySelectorAll(".section-instructor")].filter(e => e.textContent === name);
    for (const section of sectionInfos) {
        // remove all elements with 'rating-loading' class rating-loading, remove it.
        if(section.nextSibling.className === 'rating-loading') {
            section.nextSibling.remove();
            console.log('removed loading');
        }

        // Remove ratings if already added
        section.querySelectorAll(ratingPlanetTerpClass).forEach(e => e.remove());

        if (profInfo[name]["pt"] != null) {
            /* Place an image next to rating with planet terp logo
                also with link to professor reviews on planet terp */
            const imageLink = document.createElement('a');
            imageLink.href = profInfo[name]["pt"]['url'];
            const image = document.createElement('img');
            image.src = chrome.runtime.getURL(logoPlanetTerpPath);
            image.style.marginLeft = "5px";
            image.style.marginRight = "3px";
            imageLink.appendChild(image);
            section.appendChild(imageLink);

            /* Create display element with link to professor reviews */
            const node = document.createElement("a");
            const rating = profInfo[name]["pt"]['rating'] ? profInfo[name]["pt"]['rating'].toFixed(2) : 'N/A';
            const textNode = document.createTextNode(rating);
            node.appendChild(textNode);
            node.href = profInfo[name]["pt"]['url'];
            node.target = "_blank";
            node.className = 'rating-planet-terp';
            node.style.color = planetTerpBlue;
            section.appendChild(node);
        }
    }
}

function displayRatingRMP(name) {
    const sectionInfos = [...document.querySelectorAll(".section-instructor")].filter(e => e.innerText === name);
    for (const section of sectionInfos) {
        /* Verify rating not already added */
        if (section.querySelectorAll(ratingRateMyProfessorClass).length === 0) {
            if (!(profInfo[name]["rmp"] == null)) {
                /* Place an image next to rating with planet terp logo also with link to professor reviews on planet terp */
                const imageLink = document.createElement('a');
                imageLink.href = profInfo[name]['rmp']['url'];
                const image = document.createElement('img');
                image.src = chrome.runtime.getURL(logoRateMyProfessorPath);
                image.style.marginLeft = "5px";
                image.style.marginRight = "3px";
                imageLink.appendChild(image);
                section.appendChild(imageLink);

                /* Create display element with link to professor reviews */
                const node = document.createElement("a");
                const textNode = document.createTextNode(profInfo[name]["rmp"]['rating'].toFixed(2));
                node.appendChild(textNode);
                node.href = profInfo[name]["rmp"]['url'];
                node.target = "_blank";
                node.className = 'rating-rate-my-professor';
                node.style.color = rateMyProfessorBlue;
                section.appendChild(node);
            }
        }
    }
}


function showLoading(name) {
    const sectionInfos = [...document.querySelectorAll(".section-instructor")].filter(e => e.innerText === name);
    for (const section of sectionInfos) {
        const node = document.createElement("span");
        const textNode = document.createTextNode("Ratings Loading...");
        node.appendChild(textNode);
        node.className = 'rating-loading';
        node.style.color = 'grey';
        section.parentNode.insertBefore(node, section.nextSibling);
    }
}

async function updateRatings() {
    /* Get professors visible on page */
    const names = getProfessors();
    const fetches = [];

    for (const name of names) {
        if (!(name in profInfo)) {
            profInfo[name] = {};
            showLoading(name);
            fetches.push(getInfoPT(name).then(() => displayRatingPT(name)));
            fetches.push(getInfoRMP(name).then(() => displayRatingRMP(name)));
        } else {
            displayRatingPT(name);
            displayRatingRMP(name);
        }
    }
    await Promise.all(fetches);
    // console.log('done!')
}

/* Display ratings for all professors
    that are initially visiable */
$(document).ready(updateRatings)


/* Observe if professors become visible */
const observer = new MutationObserver(mutations => {
    mutations.forEach(function (mutation) {
        if (mutation.attributeName !== 'style') return;
        if (mutation.target.className !== "hidden section-deliveryFilter") return;
        updateRatings();
    });
});

/* Get all elements that control whether professors are visible */
/* Monitor entire subtree for attribute changes */
observer.observe(document.querySelector(contentContainerClass), {subtree: true, attributes: true});