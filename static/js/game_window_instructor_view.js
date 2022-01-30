$(document).ready(function(){
    var meta_payload = null;
    var game_payload = null;
    var user_payload = null;
    var content_payload = null;
    var matrix_payload = null;
    var gameplay_payload = null;
    var waitingroom = null;
    var waitlist_counter = 0;
    $('.score-box-divider').css('height', $("#score-col-main").css('height'));
    Pusher.logToConsole = true;

    var pusher = new Pusher('f7e3f6c14176cdde1625', {
      cluster: 'us2'
    });
    function new_waiting_room_user(payload){
        $('.waitlist-main .waiting-room-empty').remove();
        $('.waitlist-main').append(`
                <div class='user-waiting'>
                    <div class='user-waiting-name'>${payload.name}</div>
                    <div class='user-waiting-email'>${payload.email}</div>
                </div>`)
        waitlist_counter++;
        $('.waitlist-size').html(`${waitlist_counter} player${waitlist_counter === 1 ? "" : "s"} waiting`)
    }
    var response_handlers = {1:new_waiting_room_user};
    function setup_pusher_handlers(){
        var channel = pusher.subscribe('game-events');
        channel.bind(`game-events-${game_payload.id}`, function(data) {
            console.log('got data from pusher game-events')
            console.log(data)
            response_handlers[data.handler](data.payload)
        });
    }
    function setup_waiting_room(){
        $('.waitlist-main').html(``);
        if (waitingroom.length > 0){
            for (var i of waitingroom){
                $('.waitlist-main').append(`
                <div class='user-waiting'>
                    <div class='user-waiting-name'>${i.name}</div>
                    <div class='user-waiting-email'>${i.email}</div>
                </div>`)
            }
        }
        else{
            $('.waitlist-main').html(`<div class='waiting-room-empty'><i>No players have entered yet</i></div>`)
        }
        waitlist_counter = waitingroom.length;
        $('.waitlist-size').html(`${waitlist_counter} player${waitlist_counter === 1 ? "" : "s"} waiting`)
    }
    function load_start(){
        meta_payload = $('.main').data('pld')
        $.ajax({
            url: "/load-game-instance-instructor",
            type: "post",
            data: {payload: JSON.stringify(meta_payload)},
            success: function(response) {
                var payload = JSON.parse(response.payload);
                console.log(payload)
                game_payload = payload.game;
                user_payload = payload.user;
                content_payload = payload.content;
                matrix_payload = payload.matrix;
                gameplay_payload = payload.gameplay;
                waitingroom = payload.waitingroom;
                if (gameplay_payload.id === null){
                    setup_pusher_handlers();
                    setup_waiting_room();
                }
                else{
                    //setup current game state
                }
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    load_start();
});