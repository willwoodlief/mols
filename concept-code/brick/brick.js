
var bricks = ['first','second','third'];
var ss_prefix = ''; //when clicking on the brick parts, they will set this to have 'unit_id,type,id'
var command_buffer = [];
var command_buffer_pointer = -1;
var COLORS = {};
COLORS.gate_on = '#eeeeee';
COLORS.gate_off = '#888888';

//returns json of all all data, as well as saving to local storge
function save_all() {
    var t = {
        mol_save: MOL.get_export_data(),
        ss_prefix: ss_prefix,
        command_buffer: command_buffer,
        command_buffer_pointer: command_buffer_pointer,
        data_entry_value: $('#edit-here').val()
    };

    var js = JSON.stringify(t);
    localStorage.setItem( 'save_all', js );
    return js;
}

//restores from input, or if input is null, then just local storage
function restore_all(input) {
    var t = {};
    if (input) {
        t = JSON.parse(input);
    } else {
        var runs = localStorage.getItem( 'save_all');
        if (runs) {
            t= JSON.parse(runs);
        } else {
            return;
        }

    }
    MOL.restore_from_data( t.mol_save);
    ss_prefix = t.ss_prefix;
    command_buffer = t.command_buffer;
    command_buffer_pointer = t.command_buffer_pointer;
    $('#edit-here').val( t.data_entry_value);
    refresh_gui();

}

function refresh_gui() {
    for(var i = 0; i < bricks.length; i++) {
        pairBrick(bricks[i],MOL.units[i]); //units have same index as the brick, as they start from 0 and go up
    }
}

$(function() {



    for(var i = 0; i < bricks.length; i++) {
        makeBrick(bricks[i]);
        var unit = MOLG.edit_unit('NEW');
        pairBrick(bricks[i],unit);
    }
    restore_all();

    $('.step-button').click(function() {
        MOL.step();
        for(var i = 0; i < bricks.length; i++) {
            pairBrick(bricks[i],MOL.units[i]); //units have same index as the brick, as they start from 0 and go up
        }
        save_all();
    });


    $('#edit-here').keydown(function(e) {
        var edit_here = $('#edit-here');


        if (e.keyCode == 38) {  //up arrow
            if (command_buffer_pointer > 0) {command_buffer_pointer--; }

            if (command_buffer_pointer >=0 && command_buffer_pointer < command_buffer.length) {
                edit_here.val(command_buffer[command_buffer_pointer]);
            } else {
                edit_here.val('');
                command_buffer_pointer = (command_buffer.length > 0)? 0 : -1;
            }
            e.preventDefault();
        }
        else if (e.keyCode == 40 ) {  //down arrow
            if (command_buffer_pointer < command_buffer.length) {command_buffer_pointer++; }

            if (command_buffer_pointer >=0 && command_buffer_pointer < command_buffer.length) {
                edit_here.val(command_buffer[command_buffer_pointer]);
            } else {
                edit_here.val('');
                command_buffer_pointer = (command_buffer.length > 0)? command_buffer.length -1 : -1;
            }
            e.preventDefault();
        }
        else if (e.keyCode == 13) { //return
            try {
                e.preventDefault();
                var ss = edit_here.val();
                var s = ss_prefix + ',' + ss;
                command_buffer.push(s);
                command_buffer_pointer = command_buffer.length ;


            } catch (e) {
                alert(e);
            }
            refresh_gui();

            save_all();
            edit_here.val('');
            return false;
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
        var event = unit.instructions[i];
        for(var k =0; k < event.length; k ++) {
            var ins = event[k];
            //id, unit_id,signal,op,oprand1,oprand2,result
            ins_string = '[' + i + '] ' + ins.id + ', ' + ins.signal + ', ' + ins.op + ', ' + ins.oprand1 + ', ' + ins.oprand2 + ', ' + ins.result ;
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
            $("<li/>",{
                "class" : "instruction-item",
                // .. you can go on and add properties
                "css" : {

                },
                "html" : what,
                "click" :  function (w_unit_id,the_id,description) {
                        return function () {
                            setPrefix(w_unit_id,'I',the_id);
                            setTitle('[' + w_unit_id + '] ' + description );
                            return false;
                        };
                    }(unit.id,what_id,what)



            }).appendTo(ins_gui.find('ul')[0]);

        }
    }

}

function fillData(parent_class,unit){
    var data_gui = $('.' + parent_class +' .storage');
    data_gui.off("click");
    data_gui.html('');

    data_gui.click(function() {
        setPrefix(unit.id,'D',null);
        setTitle('[' + unit.id + '] Data Set' );
    });


    var ins_array = [];
    var ins_ids = [];

    for(var i in unit.data) {
        var ins_string = 'data[' + i + '] ';
        var data = unit.data[i];
        ins_string += ' = ' +  data;
        ins_array.push(ins_string);
        ins_ids.push(i);
    }

    if (ins_array.length > 0) {
        $("<ul/>",{
            "class" : "data-list",
            // .. you can go on and add properties
            "css" : {

            }
        }).appendTo(data_gui);


        for(var j =0;j < ins_array.length;j++ ) {
            var what = ins_array[j];
            var what_id = ins_ids[j];
            $("<li/>",{
                "class" : "data-item",
                // .. you can go on and add properties
                "css" : {

                },
                "html" : what,
                "click" :  function (w_unit_id,the_id,description) {
                    return function () {
                        setPrefix(w_unit_id,'D',the_id);
                        setTitle('[' + w_unit_id + '] ' + description );
                        return false;
                    };
                }(unit.id,what_id,what)



            }).appendTo(data_gui.find('ul')[0]);

        }
    }
}

function fillCache(parent_class,unit){
    var cache_gui = $('.' + parent_class +' .cache');
    cache_gui.off("click");
    cache_gui.html('');

    cache_gui.click(function() {
        setPrefix(unit.id,'C',null);
        setTitle('[' + unit.id + '] Cache Slot' );
    });


    var ins_array = [];
    var ins_ids = [];

    for(var i in unit.cache) {
        var ins_string = 'cache[' + i + '] ';
        var data = unit.cache[i];
        ins_string += ' = ' +  data;
        ins_array.push(ins_string);
        ins_ids.push(i);
    }

    if (ins_array.length > 0) {
        $("<ul/>",{
            "class" : "cache-list",
            // .. you can go on and add properties
            "css" : {

            }
        }).appendTo(cache_gui);


        for(var j =0;j < ins_array.length;j++ ) {
            var what = ins_array[j];
            var what_id = ins_ids[j];
            $("<li/>",{
                "class" : "cache-item",
                // .. you can go on and add properties
                "css" : {

                },
                "html" : what,
                "click" :  function (w_unit_id,the_id,description) {
                    return function () {
                        setPrefix(w_unit_id,'C',the_id);
                        setTitle('[' + w_unit_id + '] ' + description );
                        return false;
                    };
                }(unit.id,what_id,what)



            }).appendTo(cache_gui.find('ul')[0]);

        }
    }
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

    $("<div/>",{
        "class" : "cache",
        // .. you can go on and add properties
        "css" : {
            "color" : "black"
        }
    }).appendTo("."+parent_class);
}