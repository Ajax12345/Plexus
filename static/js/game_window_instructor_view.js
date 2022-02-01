$(document).ready(function(){
    var meta_payload = null;
    var game_payload = null;
    var user_payload = null;
    var content_payload = null;
    var matrix_payload = null;
    var gameplay_payload = null;
    var waitingroom = null;
    var waitlist_counter = 0;
    var roles = null;
    var response_template = null;
    var running_round = 1;
    var given_strategy_hint = false;
    
    class Template{
        constructor(template){
            this.template = template;
        }
        render_text(str, params){
            return str.replace(/\{\w+\}/g, function(match, ...p){
                return params[match.substring(1, match.length-1)];
            });
        }
        format(params){
            var self = this;
            return Object.fromEntries(Object.keys(self.template).map(function(x){return [x, self.render_text(self.template[x], params)]}))
        }
    }
    class TemplateCycle{
        constructor(options){
            this.options = options;
            this.ind = 0;
        }
        next(){
            var self = this;
            if (self.ind >= self.options.length){
                self.ind = 0;
            }
            self.ind++;
            return new Template(self.options[self.ind-1])
        }
    }
    class ResponseTemplate{
        static templatify(template){
            for (var i of Object.keys(template)){
                if (Array.isArray(template[i])){
                    template[i] = new TemplateCycle(template[i]);
                }
                else{
                    ResponseTemplate.templatify(template[i])
                }
            }
        }
    }
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
        start_game_check();
    }
    function start_game_check(){
        if (waitlist_counter > 1){
            $('.start-game').removeClass('start-game-disabled');
        }
    }
    function start_game(payload){
        console.log('in start game handler')
        roles = payload.roles;
        gameplay_payload.id = payload.gpid;
        $('.waitlist-background').css('display', 'none')
    }
    var response_handlers = {1:new_waiting_room_user, 2:start_game};
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
        start_game_check();
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
                response_template = payload.response_template;
                ResponseTemplate.templatify(response_template);
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
    $('body').on('click', '.start-game', function(){
        if (!$(this).hasClass('start-game-disabled')){
            $(this).html('Starting game...')
            $.ajax({
                url: "/start-game",
                type: "post",
                data: {payload: JSON.stringify(meta_payload)},
                success: function(response) {
                    //pass
                },
                error: function(xhr) {
                    //Do Something to handle error
                }
            });
        }
    }); 
});