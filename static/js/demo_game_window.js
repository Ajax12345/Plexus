$(document).ready(function(){
    $('body').on('click', '.game-content-close-top', function(){
        $('.game-content-modal').css('display', 'none');
    });
    $('body').on('click', '.close-content-modal', function(){
        $('.game-content-modal').css('display', 'none');
    });
    var meta_payload = null;
    var game_payload = null;
    var user_payload = null;
    var content_payload = null;
    var matrix_payload = null;
    function setup_start_screen(next_step = function(){}){
        $('.user-name-about').html(user_payload.name);
        $('.user-handle-about').html('@'+user_payload.name.replace(' ', '_').toLowerCase());
        $('.game-announcement-title').html(`Protest Set to Occur Between ${matrix_payload.actors[1].name} and ${matrix_payload.actors[2].name}.`);
        $('.game-announcement-body').html(`${matrix_payload.actors[1].name} and ${matrix_payload.actors[2].name} will face off in a pivotal confrontation.`)
        $('.what-you-need-to-know:nth-of-type(2)').html(`-In a moment, you will be assignmed to a team, either <span class="side-hashtag">#${matrix_payload.actors[1].name}</span> or <span class="side-hashtag">#${matrix_payload.actors[2].name}</span>`)
        $('.what-you-need-to-know:nth-of-type(3)').html(`-This game is ${game_payload.rounds} round${game_payload.rounds === 1 ? "" : "s"}. In each round, you and your teammates will choose a reaction as a response to your opponent's reaction`)
        $('.game-content-modal').css('display', 'block');
        next_step();

    }
    function load_start(){
        meta_payload = $('.main').data('pld')
        $.ajax({
            url: "/load-full-game-instance",
            type: "post",
            data: {payload: JSON.stringify(meta_payload)},
            success: function(response) {
                var payload = JSON.parse(response.payload);
                game_payload = payload.game;
                user_payload = payload.user;
                content_payload = payload.content;
                matrix_payload = payload.matrix;
                setup_start_screen(function(){
                    $('.game-loading-state-display').css('display', 'none');
                
                });
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    load_start();
});