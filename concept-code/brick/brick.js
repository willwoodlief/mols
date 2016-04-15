


$(function() {
    MOL.units[0] = new MOL.unit(0);
    MOL.units[0].gates[0] = new MOL.gate(0,0,1,'testy ns',true);
    MOL.units[0].add_ins( new MOL.instruction(0,0,'DS-0','add','DT-1','GD-4','GS-1'));


    makeBrick('first');
    makeBrick('second');
    makeBrick('third');

    $('.first .gate_house').css("background-color",'blue');
});

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