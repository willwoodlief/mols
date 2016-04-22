


$(function() {


    var bricks = ['first','second','third'];
    for(var i = 0; i < bricks.length; i++) {
        makeBrick(bricks[i]);
        var unit = MOLG.edit_unit('NEW');
        pairBrick(bricks[i],unit);
    }

    $('.step-button').click(function() {
        MOL.step();
        for(var i = 0; i < bricks.length; i++) {
            pairBrick(bricks[i],MOL.units[i]); //units have same index as the brick, as they start from 0 and go up
        }
    });

    //$('.first .gate_house').css("background-color",'blue');
});

//sets up the data associations and click handlers
//and creating elements to show each of the unit's parts
//also highlights the next instructions to be run the next time, in the unit
function pairBrick(parent_class,unit) {
    clearBrick(parent_class);
    fillBrick(parent_class,unit);
    showNextInstructions(parent_class,unit);
}

function clearBrick(parent_class) {

}

function fillBrick(parent_class,unit) {

}

function showNextInstructions(parent_class,unit) {

}

//create the brick on screen given an x and y
function makeBrick(parent_class) {
    $("<div/>",{
        "class" : "gate_house",
        // .. you can go on and add properties
        "css" : {
            "color" : "black"
        },
        "click" : function(){
            alert("you just clicked me!!");
        },
        "data" : {
            "foo" : "bar"
        }
    }).appendTo("."+parent_class);

    for(var i=0;i<4;i++) {
        $("<div/>",{
            "class" : "gate",
            // .. you can go on and add properties
            "css" : {
                "color" : "black"
            }
        }).appendTo("."+parent_class + ' .gate_house');
    }


    $("<div/>",{
        "class" : "cpu",
        // .. you can go on and add properties
        "css" : {
            "color" : "black"
        }
    }).appendTo("."+parent_class);

    $("<div/>",{
        "class" : "storage",
        // .. you can go on and add properties
        "css" : {
            "color" : "black"
        }
    }).appendTo("."+parent_class);
}