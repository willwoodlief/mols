/**
 * Created by will on 4/22/16.
 */

var MOLG = {};
/*
edit string : (unit,type,command)
    Unit ID,  type, [optional id],major command, other
    UNIT ID: numerical id or NEW
     type: gate,instruction,data ,cache (GIDC)
    command: E = edit , + = add, - = delete

comma delimited, start with G I d
 input strings to edit a part,
 GATE: direction , namespace, power
 INSTRUCTION : signal,op,oprand1,oprand2,result
 DATA: value
 */

// order of expected params to: unit_id,type,item_id,edit action where item id is optional
//then take rest of remaining elements, make new array with item_id as first (if its there)
MOLG.edit_unit = function (edit_string) {
    //split edit string
    var edit_array = edit_string.split(',');
    var unit_id = edit_array[0];
    if (unit_id == 'NEW') {
      //get the next unit id
      var next_unit_id = Object.keys( MOL.units).length;
      return MOLG.make_unit(next_unit_id);
    }
    if (!(unit_id in MOL.units) ) {throw "id not found in units";}

    var type = edit_array[1];
    var other_info = null;
    if (isNaN(parseInt(edit_array[2])) )  {
        //then index 2 is a command
        var command = edit_array[2];
         other_info = edit_array.slice(3);
    } else {
        var c_id = edit_array[2];
        command = edit_array[3];
         other_info = edit_array.slice(4);
        other_info.unshift(c_id);
    }

    command = command.trim();
    type = type.trim();
    switch (command) {
        case 'E':
        case 'e':
            switch (type) {
                case 'g':
                case 'G':
                    MOLG.edit_gate(unit_id,other_info);
                    break;
                case 'i':
                case 'I':
                    MOLG.edit_instruction(unit_id,other_info);
                    break;
                case 'd':
                case 'D':
                    MOLG.edit_data(unit_id,other_info);
                    break;
                case 'c':
                case 'C':
                    MOLG.edit_cache(unit_id,other_info);
                    break;
                default: throw "unknown type: " + type;

            }
            break;


            case '+':
            switch (type) {
                case 'g':
                case 'G':
                    MOLG.new_gate(unit_id,other_info);
                    break;
                case 'i':
                case 'I':
                    MOLG.new_instruction(unit_id,other_info);
                    break;
                case 'd':
                case 'D':
                     MOLG.new_data(unit_id,other_info);
                     break;
                case 'c':
                case 'C':
                    MOLG.new_cache(unit_id,other_info);
                    break;
                default: throw "unknown type: " + type;
            }
            break;

            case '-':
            switch (type) {
                case 'g':
                case 'G':
                    MOLG.delete_gate(unit_id,other_info);
                    break;
                case 'i':
                case 'I':
                    MOLG.delete_instruction(unit_id,other_info);
                    break;
                case 'd':
                case 'D':
                     MOLG.delete_data(unit_id,other_info);
                    break;
                case 'c':
                case 'C':
                    MOLG.delete_cache(unit_id,other_info);
                    break;
                default: throw "unknown type: " + type;
            }
            break;

        default:
            throw "Unknown command: " + command;


    }
    return MOL.units[unit_id];


};


MOLG.new_gate = function (unit_id,params) {

    if (params.length != 3) {throw "need direction,namespace,power"}
    var gate_id = Object.keys( MOL.units[unit_id].gates).length;
    //id,unit_id,direction,namespace,power
    var direction_input = parseInt(params[0]);
    if (direction_input == 0) {throw 'direction must be +- 1'}
    var direction = 1;
    if (direction_input < 0) { direction = -1;}

    var namespace = params[1];
    var power =  params[2].match(/^(true|yes|t|y|1)$/i)? true : false;
    MOL.units[unit_id].gates[gate_id] = new MOL.gate(gate_id,unit_id,direction,namespace,power);
};

MOLG.edit_gate = function (unit_id,params) {
    if (params.length != 4) {throw "need gat id,direction,namespace,power"}
    var gate_id = params[0];
    if (!(gate_id in MOL.units[unit_id].gates)) {throw "gate id invalid for unit, gate given was: " + gate_id}
    var gate = MOL.units[unit_id].gates[gate_id];

    var direction =   params[1].match(/^(off|in|i|inwards|false|0|-1)$/i) ? -1 : 1;

    var namespace = params[2];

    var power =  params[3].match(/^(true|yes|t|y|1|on|power)$/i) ? true : false;

    gate.direction = direction;
    gate.namespace = namespace;
    gate.power = power;

};

MOLG.delete_gate = function (unit_id,params) {
    if (params.length != 1) {throw "need gat id"}
    var gate_id = params[0];
    if (!(gate_id in MOL.units[unit_id].gates)) {throw "gate id invalid for unit, gate given was: " + gate_id}
    delete MOL.units[unit_id].gates[gate_id];
};


MOLG.new_instruction = function (unit_id,params) {

    if (params.length != 5) {throw "need signal,op,oprand1,oprand2,result"}

    var ins_id = Object.keys( MOL.units[unit_id].instructions).length;

    var signal = params[0];
    if (!MOL.is_valid_instruction_pattern(signal))  {throw "Signal is not valid: " + signal;}
    var op = params[1];
    if (!(op in MOL.op)) {throw "not recognized operation: " + op}

    var oprand1 = params[2];
    if (!MOL.is_valid_instruction_pattern(oprand1))  {throw "oprand1 is not valid: " + oprand1;}

    var oprand2 = params[3];
    if (!MOL.is_valid_instruction_pattern(oprand2))  {throw "oprand2 is not valid: " + oprand1;}


    var result = params[4];
    if (!MOL.is_valid_instruction_pattern(result))  {throw "result is not valid: " + oprand1;}

    //id,unit_id,signal,op,oprand1,oprand2,result
    MOL.units[unit_id].add_ins( new MOL.instruction(ins_id,unit_id,signal,op,oprand1,oprand2,result));
};

MOLG.edit_instruction = function (unit_id,params) {
    if (params.length != 6) {throw "need instruction id, signal,op,oprand1,oprand2,result"}

    var ins_id = params[0];
    if (!(ins_id in MOL.units[unit_id].instructions_by_id)) {throw "instruction id invalid for unit, id given was: " + ins_id}

    var signal = params[1];
    if (!MOL.is_valid_instruction_pattern(signal))  {throw "Signal is not valid: " + signal;}

    var op = params[2];
    if (!(op in MOL.op)) {throw "not recognized operation: " + op}

    var oprand1 = params[3];
    if (!MOL.is_valid_instruction_pattern(oprand1))  {throw "oprand1 is not valid: " + oprand1;}

    var oprand2 = params[4];
    if (!MOL.is_valid_instruction_pattern(oprand2))  {throw "oprand2 is not valid: " + oprand1;}


    var result = params[5];
    if (!MOL.is_valid_instruction_pattern(result))  {throw "result is not valid: " + oprand1;}

    //id,unit_id,signal,op,oprand1,oprand2,result
    var ins = MOL.units[unit_id].instructions_by_id[ins_id];
    ins.signal = signal;
    ins.op = op;
    ins.oprand1 = oprand1;
    ins.oprand2 = oprand2;
    ins.result = result;
};

MOLG.delete_instruction = function (unit_id,params) {
    if (params.length != 1) {throw "need instruction id"}
    var ins_id = params[0];
    if (!(ins_id in MOL.units[unit_id].instructions_by_id)) {throw "instruction id invalid for unit, id given was: " + ins_id}

    var ins = MOL.units[unit_id].instructions_by_id[ins_id];
    MOL.units[unit_id].remove_ins(ins);

};


MOLG.new_data = function (unit_id,params) {
    if (params.length != 1) {throw "need data"}
    var data_id = Object.keys( MOL.units[unit_id].data).length;
    MOL.units[unit_id].data[data_id] = parseFloat(params[0]);
};

MOLG.edit_data = function (unit_id,params) {
    if (params.length != 2) {throw "need data id, data"}
    var data_id = params[0];
    if (!(data_id in MOL.units[unit_id].data)) {throw "data id invalid for unit, data id given was: " + data_id}
    MOL.units[unit_id].data[data_id] = parseFloat(params[1]);
};


MOLG.delete_data = function (unit_id,params) {
    if (params.length != 1) {throw "need data id"}
    var data_id = params[0];
    if (!(data_id in MOL.units[unit_id].data)) {throw "data id invalid for unit, data id given was: " + data_id}
    delete MOL.units[unit_id].data[data_id];
};


MOLG.new_cache = function (unit_id,params) {
    if (params.length != 2) {throw "need cache id,data"}
    var cache_id = params[0];
    if (!MOL.is_valid_instruction_pattern(cache_id))  {throw "cache id is not valid: " + cache_id;}
    MOL.units[unit_id].cache[cache_id] = parseFloat(params[1]);
};

MOLG.edit_cache = function (unit_id,params) {

    if (params.length != 2) {throw "need cache id,data"}
    var cache_id = params[0];
    if (!MOL.is_valid_instruction_pattern(cache_id))  {throw "cache id is not valid: " + cache_id;}
    if (!(cache_id in MOL.units[unit_id].cache)) {throw "cache id was not already in cache for editing: " + cache_id}
    MOL.units[unit_id].cache[cache_id] = parseFloat(params[1]);

};


MOLG.delete_cache = function (unit_id,params) {
    if (params.length != 1) {throw "need cache id"}
    var cache_id = params[0];
    if (!(cache_id in MOL.units[unit_id].cache)) {throw "cache id was not already in cache for editing: " + cache_id}
    delete MOL.units[unit_id].cache[cache_id];
};





//returns a unit with four gates
MOLG.make_unit = function (unit_id){
    MOL.units[unit_id] = new MOL.unit(unit_id);
    for(var i = 0;i <4;i++) {
        //id,unit_id,direction,namespace,power
        MOL.units[unit_id].gates[i] = new MOL.gate(i,unit_id,1,'ns-'+unit_id+'-'+i,false);
    }

    //add token instruction

    //get next instruction id
    var ins_id = Object.keys( MOL.units[unit_id].instructions).length;

    //id,unit_id,signal,op,oprand1,oprand2,result
    MOL.units[unit_id].add_ins( new MOL.instruction(ins_id,unit_id,'NOP','NOP','NOP','NOP','NOP'));


    //add a data
    MOL.units[unit_id].data[0] = 0;
    return MOL.units[unit_id];
};