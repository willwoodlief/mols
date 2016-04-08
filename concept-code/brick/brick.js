/**
 * Created by will on 4/6/16.
 */
var MOL = {};

MOL.units = {};  //holds all the units
MOL.unit = function(id) {
    this.id = id;
    this.instructions = {};
    this.cache = {};
    this.data = {};
    this.data_limit = 5;
    this.gates = {};

    this.add_ins = function(ins) {
        if (!this.instructions[ins.signal]) {
            this.instructions[ins.signal] = [];
        }
        this.instructions[ins.signal].push(ins);
    }


};

MOL.gate = function(id,unit_id,direction,namespace,power) {
    this.id = id;
    this.unit_id = unit_id;
    this.direction = direction;
    this.namespace = namespace;
    this.power = power;
    this.hookup = nil;
};

MOL.instruction = function(id,signal,op,oprand1,oprand2,result) {
    this.id = id;
    this.signal = signal;
    this.op = op;
    this.oprand1 = oprand1;
    this.oprand2 = oprand2;
    this.result = result;
};


MOL.out_gates = {};
MOL.in_gates = {};
MOL.ins_next = {};
MOL.active_hookups = [];

/*
Steps each cycle:
empty all out_gates,in_gates




1) for each unit in MOL get all out_gates g that are on and put their namespace (the namespace they are looking for)
        as a key into out_gates with a ref to the gate as the value
        MOL.out_gates[g.namespace] = g

2) for each unit in MOL get all in_gates go that are on and put their NS into the hash
        MOL.in_gates[go.namespace] = go

3) match all outgates to ingates, multiple hookups for one gate is okay. For each pair found,
    make a hash {in_unit: go.unit_id, in_gate:go.id, out_unit:go.unit_id,out_gate:g.id} //avoid cycle ref
     and set each gate's hookup to this, and add to MOL.active_hookups

 4) get each gate's unit, and add any instruction whose state is 'GS' + gate.id for that gate's unit, to the MOL.ins_next

 5) ADD to each unit's cache the key , 'GS' + gate.id and set it to 1 unit.cache['GS' + gate.id] = 1

 6) EXECUTE all instructions in MOL.ins_next (remove ins from ins_next as we execute them)

 7) If any of these ins move data through a gate (D1 ++ , result GO#)
        if the target unit, that is at the end of the gate hookup, has an ins for GS#,
            add to that unit   unit.cache[GD#] = data moved (overrite if already set)
            add the ins to ins_next

 7) If any of these ins change data in their own unit (D1 + D2. result D2)
     if the unit has an ins for DD2 and DD2 has changed value
     add to that unit   unit.cache['DD2'] = index of data changed (overrite if already set)
     add all ins for this DD2 to ins_next

 8) EXECUTE ALL ins_next (removing each of the ins as we do it)

 9) Go through all MOL.hookups and see if any of the pair of gates is now off, if so see if each gate's unit
        has a detach signal (GX#), if so unit.cache[GX#] = 1 (create or overrite), remove any cache keys for incoming data
        ; delete unit.cache[GD#].remove hookup info from both gates and the hookup array
        ; delete GS# from cache




 ------------------------
 instruction works by : waits on signal : does an operation with up to two registers and then write to a register
 signals are:
 Gate Start: GS: when a gate connects
 Gate Data: GD :when there is data incoming through a gate
 Gate End: GX : when a gate detaches
 Data Delta DD : when a data slot changes value

 if there is no DG GS GX or DD in an instructions two operands, then that instruction does not affect or write anything

 instruction notation State,p1 p2 op, result
 p2 can be missing

 operations:
   math: + - * / --  %
   action_logic: AND OR NOT XOR > < >= <= <> ==
                            -- if logic is false no result is written to, if logic is true result has a 1
   logic: same as action logic           -- but result is always 0 or 1
   bitwise: & | ^ ~
   GateOff#  -- turns Gate# off
   GateOn#   -- turns Gate# on


 */


$(function() {
    MOL.units[0] = new MOL.unit(0);
    MOL.units[0].gates[0] = new MOL.gate(0,0);
    MOL.units[0].add_ins( new MOL.instruction(2,'GS3','+','D1','GS4','GU5'));
    var g = MOL.units[0].gates[0];
    var mm = MOL.units[g.unit_id];

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