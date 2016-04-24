/**
 * Created by will on 4/15/16.
 */

/**
 * Created by will on 4/6/16.
 */
var MOL = {};

//ops a hash keyed by name of op with value {fp:the function pointer, b_result:boolean}
MOL.ops = {};

MOL.units = {};  //holds all the units
MOL.unit = function(id) {
    this.id = id;
    this.instructions = {};
    this.instructions_by_id = {}; //cross reference hash to directly lookup instruction by id
    this.cache = {};  //the ids for cache, is always the signal
    this.data = {};  //the ids for data 0,1,2,3
    this.gates = {}; //the ids for gates is 0,1,2,3

    this.add_ins = function(ins) {
        if (!this.instructions[ins.signal]) {
            this.instructions[ins.signal] = [];
        }
        this.instructions[ins.signal].push(ins);
        this.instructions_by_id[ins.id] = ins;
    };

    this.remove_ins = function(ins) {
        var signals = this.instructions[ins.signal];

        var index_to_remove = -1;
        for(var i =0; i < signals.length; i++) {
            if (signals[i].id == ins.id) {
                index_to_remove = i;
                break;
            }
        }

        if (index_to_remove >= 0) {
            signals.splice(index_to_remove, 1);
        }


        delete this.instructions_by_id[ins.id];
    };

    this.add_ins_to_next = function(signal,value) {
        if ( (signal in this.instructions) && this.instructions[signal].length > 0 ) {
            this.cache[signal] = value;
            for(var j =0; j < this.instructions[signal].length; j++){
                MOL.ins_next.push(this.instructions[signal][j]);
            }
        }
    }



};

MOL.gate = function(id,unit_id,direction,namespace,power) {
    this.id = id;
    this.unit_id = unit_id;
    this.direction = direction;  // -1 for in, 1 for out
    this.namespace = namespace; //any string
    this.power = power; //false for off, true for on
    this.hookup = null; //null or array of hookups
};

MOL.instruction = function(id,unit_id,signal,op,oprand1,oprand2,result) {
    this.id = id;
    this.unit_id = unit_id;
    this.signal = signal.toUpperCase();  //signal is like GS-#, GX-#, GD-# DD-#, NOP, DT-# same as DD here
     //op is a string which needs to have an entry in MOLS.ops
    // if op returns null, or false then nothing is written

    this.op = op.toUpperCase();
    this.oprand1 = oprand1.toUpperCase(); //operands as above, DT is the direct value, DD is the signal of value change
    this.oprand2 = oprand2.toUpperCase();

    //DT-# to write to data ,GD-# to push through gate (if connected),GS-# or GX-# to turn gate on or off, NOP does nothing
    this.result = result.toUpperCase();

    //returns the result key
    this.execute = function() {
        //get value of operand 1
        var p1 = this.get_value_of(this.oprand1);
        var p2 = this.get_value_of(this.oprand2);

        //get the operation by name
        var action = MOL.op[this.op];


        var temp = action.fp(p1,p2);
        if (!action.b_result) {return null;}

        if (this.result == 'NOP' || this.result === null) {return null}
        var code = this.result.substring(0,2);
        var id = MOL.get_number_from_code(this.result);
        var gate = null;
        if (code == 'DT') {

            MOL.units[this.unit_id].data[id] = temp;
            //add data delta instruction
            var this_unit = MOL.units[this.unit_id];
            this_unit.add_ins_to_next('DD-' + id,temp);
        } else if (code == 'GD') {
            //if the gate has hookup , then write the data to the other units gate GD cache
            gate =  MOL.units[this.unit_id].gates[id];
            if (gate.direction > 0 && gate.hookup) {
                //send to each hookup
                for (var h = 0; h < gate.hookup.length;h++) {
                    var hookup = gate.hookup[h];
                    var other_unit = MOL.units[hookup.in_gate_unit_id];
                    //add instruction and copy data
                    other_unit.add_ins_to_next('GD-' + hookup.in_gate_id,temp);
                }
            }
        } else if (code == 'GS' || code == 'GX') {
            //turn the gate on or off
            gate = MOL.units[this.unit_id].gates[id];
            gate.power = temp? true : false;
        }
        return this.result;
    };

    this.get_value_of = function(key) {
        //if key is NOP return null
        if (key == 'NOP' || key === null) {return null}
        //if key starts with DT then we get the id from the data
        var code = key.substring(0,2);

        if (code == 'DT') {
            var id = MOL.get_number_from_code(key);
            return MOL.units[this.unit_id].data[id] ;
        }
        //if key starts with anything else return the cache value, or null if not exits
        if (key in MOL.units[this.unit_id].cache) {
            return MOL.units[this.unit_id].cache[key];
        } else {
            return null;
        }
    }
};


MOL.out_gates = {};
MOL.in_gates = {};
MOL.ins_next = [];
MOL.active_hookups = [];

MOL.get_export_data = function() {
  return {
      mol_units: MOL.units,
      mol_out_gates: MOL.out_gates,
      mol_in_gates: MOL.in_gates ,
      mol_ins_next: MOL.ins_next,
      mol_active_hookups: MOL.active_hookups
  };
};

MOL.restore_from_data = function(data) {
    MOL.units = {};
    for( var k in data.mol_units ) {
        var data_unit = data.mol_units[k];
        MOL.units[k]  = new MOL.unit(data_unit.id);
        MOL.units[k].data =  data_unit.data;
        MOL.units[k].cache = data_unit.cache;
        //gates
        for(var h in data_unit.gates) {
            var copy_gate = data_unit.gates[h];
            MOL.units[k].gates[copy_gate.id] = new MOL.gate(copy_gate.id,k,
                                                            copy_gate.direction,copy_gate.namespace,copy_gate.power);
        }

        //instructions
        for(var i in data_unit.instructions_by_id) {
            var copy_ins = data_unit.instructions_by_id[i];
            MOL.units[k].add_ins( new MOL.instruction(copy_ins,id,k,
                copy_ins.signal,copy_ins.op,copy_ins.oprand1,copy_ins.oprand2,copy_ins.result));
        }


    }

    MOL.out_gates = data.mol_out_gates;
    MOL.in_gates = data.mol_in_gates;

    MOL.active_hookups = data.mol_active_hookups;

    //instructions next
    MOL.ins_next =[];
    for(var x =0; x < data.mol_ins_next.length;x++) {
        var i_n = data.mol_ins_next[x];
        var i_n_unit_id = i_n.unit_id;
        var i_n_ins_id = i_n.id;
        var found_ins = MOL.units[i_n_unit_id].instructions_by_id[i_n_ins_id];
        MOL.ins_next.push(found_ins);
    }
};

//returns last one or two characters if they are a number
MOL.get_number_from_code = function(thingee) {
    //for right now, examine last 2 characters , see if they are digits and return them
    var f1 = thingee.charAt(thingee.length-2);
    var f2 = thingee.charAt(thingee.length-1);

    var ret = '';
    if (f1 >= '0' && f2 <= '9') {
        // it is a number
        ret += f1;
    }
    if (f2 >= '0' && f2 <= '9') {
        // it is a number
        ret += f2;
    }
    return ret;
};

MOL.step = function() {


    //make copy of instructions to execute
    var ins_copy = MOL.ins_next;
    MOL.ins_next = [] ; //clear instructions for any new that might be coming in
    for (var ins_index = 0; ins_index < ins_copy.length; ins_index++) {
        var ins = ins_copy[ins_index];
        ins.execute();
    }  //8 and 9 done by execute


    //1) Go through all MOL.hookups and see if any of the pair of gates is now off, if so see if each gate's unit
    //has a detach signal (GX#), if so unit.cache[GX#] = 1 (create or overwrite)
    for(var i =0; i < MOL.active_hookups.length; i++) {
        var hookup =  MOL.active_hookups[i];
        var in_unit = MOL.units[hookup.in_gate_unit_id];
        var in_gate = in_unit.gates[hookup.in_gate_id];

        var out_unit = MOL.units[hookup.out_gate_unit_id];
        var out_gate = out_unit.gates[hookup.out_gate_id];

        if (!out_gate.power || !in_gate.power) {
            //gates unhook, see if the unit has a detatch signal

            //in_gate detach signal
            var in_detatch_signal = 'GS-' + hookup.in_gate_id;
            in_unit.add_ins_to_next(in_detatch_signal,1);

            //out_gate detach signal
            var out_detatch_signal = 'GS-' + hookup.in_gate_id;
            out_unit.add_ins_to_next(out_detatch_signal,1);
        }
    } //end step 1

    /*
     2)  empty all out_gates
     for each unit in MOL get all out_gates g that are on and put their namespace (the namespace they are looking for)
     as a key into out_gates with a ref to the gate as the value
     MOL.out_gates[g.namespace] = g

     3) Empty all in_gates. For each unit in MOL get all in_gates go that are on and put their NS into the hash
     MOL.in_gates[go.namespace] = go

     */
    MOL.out_gates = {};
    MOL.in_gates = {};
    for (var u in MOL.units) {
        if (! MOL.units.hasOwnProperty(u) ) {continue;}
        var unit = MOL.units[u];

        for (var g in unit.gates) {
            if (! unit.gates.hasOwnProperty(g) ) {continue;}
            var gate = unit.gates[g];
            if (gate.direction > 0) {
                //out gate
                MOL.out_gates[gate.namespace] = gate;

            } else {
                MOL.in_gates[gate.namespace] = gate;
            }
        }
    }
    /*
     4) match all outgates to ingates, multiple hookups for one gate is okay.
     (for each outgate key see if there is an ingate key)
     For each pair found,
     make a hash {in_gate_unit_id: go.unit_id, in_gate_id:go.id, out_gate_unit_id:go.unit_id,out_gate_id:g.id} //avoid cycle ref
     and set each gate's hookup to this, and add to MOL.active_hookups

     5) get each gate's unit, and add any instruction whose state is 'GS' + gate.id for that gate's unit, to the MOL.ins_next

     6) ADD to each unit's cache the key , 'GS' + gate.id and set it to 1 unit.cache['GS' + gate.id] = 1, add them to the next instructions

     */

    for (var out_key in MOL.out_gates) {
        if (! MOL.out_gates.hasOwnProperty(o) ) {continue;}
        if (out_key in MOL.in_gates)  {
            //match
            out_gate = MOL.out_gates[out_key];
            in_gate = MOL.in_gates[out_key];
            var new_hookup = {in_gate_unit_id: in_gate.unit_id, in_gate_id:in_gate.id, out_gate_unit_id:out_gate.unit_id,out_gate_id:out_gate.id};
            MOL.active_hookups.push(new_hookup);
            if (!Array.isArray(out_gate.hookup)) {
                out_gate.hookup = [];
            }
            out_gate.hookup.push(new_hookup);

            if (!Array.isArray(in_gate.hookup)) {
                in_gate.hookup = [];
            }
            in_gate.hookup.push(new_hookup);

            in_unit = MOL.units(in_gate.unit_id);
            var in_gate_start_signal = 'GS-' + in_gate.id;
            in_unit.add_ins_to_next(in_gate_start_signal,1);

            out_unit = MOL.units(out_gate.unit_id);
            var out_gate_start_signal = 'GS-' + out_gate.id;
            out_unit.add_ins_to_next(out_gate_start_signal,1);
        }
    }  //end step 3,4,5

    /*
     7) EXECUTE ALL ins_next (removing each of the ins as we do it)

     8) If any of these ins move data through a gate (D1 ++ , result GO#)
     if the target unit, that is at the end of the gate hookup, has an ins for GS#,
     add to that unit   unit.cache[GD#] = data moved (overwrite if already set)
     add the ins to ins_next

     9)
     If any of these ins change data in their own unit (D1 + D2. result D2)
     if the unit has an ins for DD2 and DD2 has changed value
     add to that unit   unit.cache['DD2'] = index of data changed (overwrite if already set)
     add all ins for this DD2 to ins_next

     */









};

//add instructions to use
INS = {};
// add returns null if one of them is null (experimental)
INS.add = function(a,b) { if (a === null || b=== null) {return null;} return a +b;};
MOL.op = {};
MOL.op['ADD'] = {fp: INS.add, b_result:true};

INS.NOP = function(a,b) { /* does nothing */};
MOL.op['NOP'] = {fp:INS.NOP, b_result:false};

//only write to the result if oprand1 > oprand2
INS['ACTION>'] = function(a,b) { if (a === null || b=== null) {return null;} return a > b; };
MOL.op['ACTION>'] = {fp:INS['action>'], b_result:false};


MOL.is_valid_instruction_pattern = function(what) {
    //GS-#, GX-#, GD-# DD-#, NOP, DT-# same as DD
    var prefix = what.slice(0,2).toUpperCase;
    switch (prefix) {
        case 'GS-':
        case 'GX-':
        case 'GD-':
        case 'DD-':
        case 'NOP':
        case 'DT-':
            return true;

        default:    return false;
    }
};

/*
 ------------------------
 instruction works by : waits on signal : does an operation with up to two registers and then write to a register
 signals are:
 Gate Start: GS: when a gate connects
 Gate Data: GD :when there is data incoming through a gate
 Gate End: GX : when a gate detaches
 Data Delta DD  : when a data slot changes value
 NOP No Signal
 DT No Signal

 if there is no GD GS GX or DD in an instructions two operands, then that instruction does not affect or write anything

 instruction notation State,p1 p2 op, result
 p2 can be missing

 operations:
 math: + - * / --  %
 action_logic: AND OR NOT XOR > < >= <= <> ==
 -- if logic is false no result is written to, if logic is true result has a 1
 logic: same as action logic           -- but result is always 0 or 1
 bitwise: & | ^ ~

 NOP  no operation


 RESULTS and OPERANDS
 the signals above
 GD, moves the result through the data hookup
 DT, moves the result to the units data
 NOP,DD does nothing here (DD signals produced by the framework and are not directly writable)
 GS,GX turn gate on or off

 Gate Move: GM Move data through gate, here data is just copied
 Data: D: destination is to the data #

 Please note that all combinations of signals, operands, operators and results are legal

 */
