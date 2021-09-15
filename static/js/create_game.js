$(document).ready(function(){
    var step = 1;
    var game_payload = {name:null, rounds:6, content:null, matrix:null};
    function format_progress_bar(){
        for (var i of document.querySelectorAll('.step-listing-col')){
            if (!$(i).data('circle')){
                $(`#step-progress-col${$(i).data('sid')} > .progress-bar`).css('height', $(i).css('height'));
            }
            else{
                var nh = (parseInt($(i).css('height').match('\\d+')) - parseInt($(`#step-progress-col${$(i).data('sid')} > .process-circle`).css('height').match('\\d+')))/2;
                $(`<div class='progress-bar' style='height:${nh}px'></div>`).insertBefore(`#step-progress-col${$(i).data('sid')} > .process-circle`)
                $(`<div class='progress-bar' style='height:${nh}px'></div>`).insertAfter(`#step-progress-col${$(i).data('sid')} > .process-circle`)
                
            }
        }
    }
    $('.game-name-field').focus();
    setTimeout(function(){
        format_progress_bar();
    }, 100);
    $('body').on('input', '.game-name-field', function(){
        game_payload.name = $(this).val();
    });
    $('body').on('input', '.round-number-field', function(){
        var r = parseInt($(this).val())
        if (r < 1){
            $(this).val('1')
            game_payload.rounds = r;

        }
    });
    function step_1(){
        if (game_payload.name === null || game_payload.name.length === 0){
            
        }
    }
    var step_handlers = {1:step_1};
    $('body').on('click', '.next-step-button', function(){
        step_handlers[step]()
    });
});