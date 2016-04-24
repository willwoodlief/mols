/**
 * Created by will on 4/24/16.
 */

var imp_exp_dialog = null;

$(function () {
    imp_exp_dialog = $( "#imp-exp-dialog-form" ).dialog({
        autoOpen: false,
        height: 500,
        width: 700,
        modal: true,
        buttons: {
            "Import Data": function() {
                var words = $('#imp_exp_txt').text();
                restore_all(words);
                imp_exp_dialog.dialog( "close" );
            },
            Cancel: function() {
                imp_exp_dialog.dialog( "close" );
            }
        },
        open: function() {
            $("#imp_exp_txt").text(save_all());
        },
        close: function() {
            $("#imp_exp_txt").text('')
        }
    });

    $('.import-export').click(function() {
        imp_exp_dialog.dialog( "open" );
    });

});


