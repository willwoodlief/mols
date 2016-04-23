

var ss_prefix = ''; //when clicking on the brick parts, they will set this to have 'unit_id,type,id'
var COLORS = {};
COLORS.gate_on = '#eeeeee';
COLORS.gate_off = '#888888';

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


    $('#edit-here').keydown(function(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            var edit_here = $('#edit-here');
            var ss = edit_here.val();
            var s = ss_prefix + ',' + ss;
            var unit_changed = MOLG.edit_unit(s);
            pairBrick(bricks[unit_changed],MOL.units[unit_changed]);
            edit_here.val('');
        }

    });


});

//called by the brick on click handlers using the data associated with the elements inside brick
function setPrefix(unit_id,type,item_id) {

    var arr = [];
    if (unit_id != null) {arr.push(unit_id);}
    if (type != null) {arr.push(type);}
    if (item_id != null) {arr.push(item_id);}
    ss_prefix = arr.join();
}

function setTitle(title) {
    $("#what-is-edited").text(title);
}

//sets up the data associations and click handlers
//and creating elements to show each of the unit's parts
//also highlights the next instructions to be run the next time, in the unit
function pairBrick(parent_class,unit) {
    fillBrick(parent_class,unit);
    showNextInstructions(parent_class,unit);
}



function fillBrick(parent_class,unit) {

    //sets on click handers too, which call setPrefix, and sets the what-is-edited
    fillGates(parent_class,unit);
    fillInstructions(parent_class,unit);
    fillData(parent_class,unit);
    fillCache(parent_class,unit);
}

function showNextInstructions(parent_class,unit) {

}


function fillGates(parent_class,unit) {
    for(var i=0; i< 4; i++) {
        fillGate(parent_class,unit,i);
    }

}

function fillGate(parent_class,unit,index) {
    var gate_gui = $('.' + parent_class +' .gate_house .gate:eq('+index +')');
    //.css("background-color",'blue');

    gate_gui.off("click");
    gate_gui.html('');

    var gate = unit.gates[index];
    if (gate.power) {
        gate_gui.css("background-color",COLORS.gate_on);
    } else {
        gate_gui.css("background-color",COLORS.gate_off);
    }

    gate_gui.click(function() {
        setPrefix(unit.id,'G',index);
        setTitle('[' + unit.id + '] G-' + index );
    });

    //direction,namespace
    var dirn = (gate.direction < 0) ? '-' : '+';
    dirn += gate.namespace;
    $("<div/>",{
        "class" : "dirn",
        // .. you can go on and add properties
        "css" : {

        },
        "html": dirn
    }).appendTo(gate_gui);

    //connected gates
    //get all gates connected to this one
    var hookups = gate.hookup;
    var describe_hookups_array = [];
    var hookup,otherunit_id,othergate_id,other_unit,other_gate,thing;
    if (hookups) {
        if (Array.isArray(hookups)) {
            for(var j=0; j < 4;j++) {
                 hookup = hookups[j];

                 otherunit_id = hookup.in_gate_unit_id;
                 othergate_id = hookup.in_gate_id;
                if (otherunit_id == unit.id) {
                    otherunit_id = hookup.out_gate_unit_id;
                    othergate_id = hookup.out_gate_id;
                }
                 other_unit = MOL.units[otherunit_id];
                 other_gate = other_unit.gates[othergate_id];
                 thing = '['+otherunit_id+'] ' + other_gate.namespace;
                describe_hookups_array.push(thing);
            }
        } else {
             hookup = hookups;
             otherunit_id = hookup.in_gate_unit_id;
             othergate_id = hookup.in_gate_id;
            if (otherunit_id == unit.id) {
                otherunit_id = hookup.out_gate_unit_id;
                othergate_id = hookup.out_gate_id;
            }
             other_unit = MOL.units[otherunit_id];
             other_gate = other_unit.gates[othergate_id];
             thing = '['+otherunit_id+'] ' + other_gate.namespace;
             describe_hookups_array.push(thing);
        }
    }

    if (describe_hookups_array.length > 0) {
        var desc = describe_hookups_array.join("<b>");
        $("<div/>",{
            "class" : "hookups",
            // .. you can go on and add properties
            "css" : {

            },
            "html": desc
        }).appendTo(gate_gui);
    }


}

function fillInstructions(parent_class,unit){
  //make list out of each instruction
    var ins_gui = $('.' + parent_class +' .cpu');
    ins_gui.off("click");
    ins_gui.html('');


    ins_gui.click(function() {
        setPrefix(unit.id,'I',null);
        setTitle('[' + unit.id + '] Instrution Set' );
    });

    var ins_array = [];
    var ins_ids = [];
    var ins_event = [];
    var ins_string = '';
    for(var i in unit.instructions) {
        ins_string += '[' + i + '] ';
        var event = unit.instructions;
        for(var k =0; k < event.length; k ++) {
            var ins = event[k];
            //id, unit_id,signal,op,oprand1,oprand2,result
            ins_string += ins.id + ', ' + ins.signal + ', ' + ins.op + ', ' + ins.oprand1 + ', ' + ins.oprand2 + ', ' + ins.result ;
            ins_array.push(ins_string);
            ins_ids.push(ins.id);
            ins_event.push(ins.signal);
        }
    }

    if (ins_array.length > 0) {
        $("<ul/>",{
            "class" : "instruction-list",
            // .. you can go on and add properties
            "css" : {

            }
        }).appendTo(ins_gui);


        for(var j =0;j < ins_array.length;j++ ) {
            var what = ins_array[j];
            var what_id = ins_ids[j];
            $("<ul/>",{
                "class" : "instruction-list",
                // .. you can go on and add properties
                "css" : {

                },
                "html" : what,
                "click" :  function (w_unit_id,the_id,description) {
                        return function () {
                            setPrefix(w_unit_id,'I',the_id);
                            setTitle('[' + w_unit_id + '] ' + description );
                        };
                    }(unit.id,what_id,what)



            }).appendTo(ins_gui.find('ul')[0]);

        }
    }

}

function fillData(parent_class,unit){

}

function fillCache(parent_class,unit){

}

//create the brick on screen given an x and y
function makeBrick(parent_class) {
    $("<div/>",{
        "class" : "gate_house",
        // .. you can go on and add properties
        "css" : {
            "color" : "black"
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