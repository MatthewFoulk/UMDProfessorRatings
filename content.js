console.log("Chrome extension go");

function pinkifyProfessors(){
    let instructors = document.getElementsByClassName("section-instructor");
    for (instructor of instructors){
        console.log(instructor.innerText);
        instructor.style['background-color'] = "#FF00FF";
    }
}

$(document).ready(pinkifyProfessors());

var sectionBlockers = document.querySelectorAll('.hidden.section-deliveryFilter');

for (blocker of sectionBlockers){
    console.log(blocker)
    var observer = new MutationObserver( function(mutations){
        mutations.forEach( function(mutation) {
            if (mutation.attributeName !== 'style') return;
            console.log("display none has just been removed!");
            pinkifyProfessors();
        });
    });

    observer.observe(blocker, { attributes: true });
}

