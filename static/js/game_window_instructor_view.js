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
    var round_by_round_results = [];
    var player_role = null;
    var message_side = null;
    var allow_page_exit = false;
    window.onbeforeunload = on_exit_popup;

    function on_exit_popup() {
        if (!allow_page_exit){
            return 'Are you sure you want to leave the game?';
        }
    }
    
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
        console.log('roles in start_game')
        console.log(roles);
        gameplay_payload.id = payload.gpid;
        $('.waitlist-background').css('display', 'none')
        setup_play_stage()
    }
    function new_reaction_made(payload){
        console.log('in new_reaction_made handler')
        $('.round-player-reactions-container').append(`<div class='round-move-reaction'>${payload.name}(${payload.reaction_name})</div>`)
        $('.round-player-reactions-counter').html(`${payload.num_reactions} of ${payload.total_actors} ${matrix_payload.actors[parseInt(payload.side)].name} have moved`)
        $('.round-move-missing').html(`Not moved: ${payload.not_moved}`)
    }
    function update_reactions_notification_panel(payload){
        $('.round-player-reactions-container').html('');
        $('.round-player-reactions-counter').html(`0 of ${roles[parseInt(payload.actor_move_next_id)].length} ${matrix_payload.actors[parseInt(payload.actor_move_next_id)].name} have moved`)
        $('.round-move-missing').html(`Not moved: `)
    }
    function round_result_handler(payload){
        console.log('got in round result handler')
        console.log(payload)
        //analyze_reaction_response(payload);
        update_reactions_notification_panel(payload);
        analyze_reaction_response(payload);
    }
    function stop_game_handler(payload){
        //pass
    }
    function game_instructor_message_handler(payload){
        //pass
    }
    function remove_player_handler(payload){

    }
    var response_handlers = {1:new_waiting_room_user, 2:start_game, 3:new_reaction_made, 4:round_result_handler, 5:stop_game_handler, 6:game_instructor_message_handler, 7:remove_player_handler};
    function setup_pusher_handlers(){
        var channel = pusher.subscribe('game-events');
        channel.bind(`game-events-${game_payload.id}`, function(data) {
            console.log('got data from pusher game-events')
            console.log(data)
            response_handlers[data.handler](data.payload)
        });
    }
    function display_start_game_feed(){
        var non_start = Object.keys(matrix_payload.actors).filter(function(x){return parseInt(x) != parseInt(matrix_payload.move)})[0]
        var first_move_a = matrix_payload.actors[matrix_payload.move].name;
        player_role = matrix_payload.move;
        $('.side-hashtag side-hashtag-header').html(`#${first_move_a}`);
        var second_move_a = matrix_payload.actors[non_start].name;
        var start_template = response_template.round_by_round.start.next().format({first_move_actor:first_move_a, second_move_actor:second_move_a, present_tense_to_be:present_tense_to_be(first_move_a), await_tense:is_singular(second_move_a) ? "awaits" : "await"})
        console.log('start template here')
        console.log(start_template)
        $('.game-announcement-title').html(all_caps(start_template.title));
        $('.game-announcement-body').html(only_start_caps(start_template.description));
    
    }
    function setup_play_stage(){
        $('.current-round').html(`Round 1 of ${game_payload.rounds}`);
        $('.side-score-outer:nth-of-type(1) .side-score-name').html(matrix_payload.actors[1].name)
        $('.side-score-outer:nth-of-type(3) .side-score-name').html(matrix_payload.actors[2].name)
        $('.actors-outer .actor-listing-main:nth-of-type(3) .team-about-large').html(`#${matrix_payload.actors[1].name}`);
        $('.actors-outer .actor-listing-main:nth-of-type(5) .team-about-large').html(`#${matrix_payload.actors[2].name}`);
        $('.side-view-wrapper .observe-side:nth-of-type(3)').html(`Observe ${matrix_payload.actors[1].name}`);
        $('.side-view-wrapper .observe-side:nth-of-type(5)').html(`Observe ${matrix_payload.actors[2].name}`);
        $('.round-player-reactions-counter').html(`0 of ${roles[matrix_payload.move].length} ${matrix_payload.actors[matrix_payload.move].name} have moved`)
        $('.round-by-round-header-entry > .round-by-round-actor:nth-of-type(2)').html(`#${matrix_payload.actors[1].name}`);
        $('.round-by-round-header-entry > .round-by-round-actor:nth-of-type(3)').html(`#${matrix_payload.actors[2].name}`);
        display_start_game_feed();
        $('.game-controls-outer').css('display', 'block');
        $('.actors-outer').css('display', 'block');
        $('.score-box-outer').css('display', 'block');
        $('.side-view-wrapper').css('display', 'block');
        $('.side-responses-view-wrapper').css('display', 'block');
        $('.gameplay-empty .game-play-main').css('display', 'block');
        $('.section-block-top').css('display', 'block');
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

                },
                error: function(xhr) {
                    //Do Something to handle error
                }
            });
        }
    }); 
    var singularity = {'police':false};
    function is_singular(name){
        if (name.toLowerCase() in singularity){
            return singularity[name.toLowerCase()];
        }
        return name[name.length - 1] != 's'
    }
    function present_tense_to_be(name){
        return is_singular(name) ? 'is' : 'are'
    }
    function past_tense_to_be(name){
        return is_singular(name) ? 'was' : 'were'
    }
    function utc_now(){
        var d = new Date();
        return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
    }
    function all_caps(s){
        var ignore = ['a', 'and', 'an', 'the', 'or', 'but', 'yet', 'were', 'was', 'while', 'to']
        return s.replace(/^[a-zA-Z]|\b[a-zA-Z]/g, function(match, ...p){
            return !ignore.includes(match) ? match.toUpperCase() : match;
        });
    }
    function only_start_caps(s){
        var actor_names = Object.keys(matrix_payload.actors).map(function(x){return matrix_payload.actors[x].name}).map(function(x){return x.toLowerCase()})
        return s.toLowerCase().replace(/^[a-zA-Z]|(\.\s)[a-zA-Z]/g, function(match, ...p){
            return match.toUpperCase()
        }).replace(/[a-zA-Z]+/g, function(match, ...p){
            return actor_names.includes(match.toLowerCase()) ? match[0].toUpperCase() + match.substring(1).toLowerCase() : match
        });
    }
    function analyze_round_performance(){
        if (round_by_round_results.length > 1){
            if (round_by_round_results.slice(round_by_round_results.length-2, round_by_round_results.length).every(function(x){return parseInt(x.round_loser_id) === parseInt(player_role)})){
                display_strategy_reminder();
            }
        }
    }
    function analyze_reaction_response(response){
        console.log('basic response')
        console.log(response)
        console.log('response template')
        console.log(response_template)
        if (!response.round_finished){
            var start_template = response_template.actor_response.next().format(response)
            console.log('start template here')
            console.log(start_template)
            $('.game-announcement-title').html(all_caps(start_template.title));
            $('.game-announcement-body').html(only_start_caps(start_template.description));
        }
        else{
            var round_result_template = parseInt(response.a1_points) === parseInt(response.a2_points) ? response_template.round_by_round.round_results_tie : response_template.round_by_round.round_results
            var round_score_standing_text = parseInt(response.a1_total_score) === parseInt(response.a2_total_score) ? response_template.round_score_standing_text.tie : response_template.round_score_standing_text.non_tie;
            var start_template = round_result_template.next().format({...response, round_score_standing_text:round_score_standing_text.next().format(response).text})
            $('.side-score-outer:nth-of-type(1) .side-score-value').html(response.a1_total_score)
            $('.side-score-outer:nth-of-type(3) .side-score-value').html(response.a2_total_score)
            $('.game-announcement-title').html(all_caps(start_template.title));
            $('.game-announcement-body').html(only_start_caps(start_template.description));
            if (document.querySelector('.round-by-round-empty') != null){
                $('.round-by-round-header-entry > .round-by-round-actor:nth-of-type(2)').html(`#${matrix_payload.actors[1].name}`);
                $('.round-by-round-header-entry > .round-by-round-actor:nth-of-type(3)').html(`#${matrix_payload.actors[2].name}`);
                $('.round-by-round').css('display', 'block');
                $('.round-by-round-spacer').css('display', 'block');
                $('.round-by-round-main').html('');
            }
            $('.round-by-round-main').prepend(`
                <div class='round-by-round-entry'>
                    <div class='round-by-round-num'>${response.round_int}</div>
                    <div class='round-reaction-points-entry'>
                        <div class='actor-reaction-entry'>${response.a1_reaction}</div>
                        <div style='height:5px'></div>
                        <div class='actor-points-awarded-outer'>
                            <div class='actor-points-prompt-entry'>points</div>
                            <div class='actor-points-round-col'>
                                <div class='actor-awarded-point-by-round'>${response.a1_points}</div>
                            </div>
                        </div>
                    </div>
                    <div class='round-reaction-points-entry'>
                        <div class='actor-reaction-entry'>${response.a2_reaction}</div>
                        <div style='height:5px'></div>
                        <div class='actor-points-awarded-outer'>
                            <div class='actor-points-prompt-entry'>points</div>
                            <div class='actor-points-round-col'>
                                <div class='actor-awarded-point-by-round'>${response.a2_points}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            round_by_round_results.push(JSON.parse(JSON.stringify(response)));
        }
        if (!response.round_finished || (running_round + 1 <= parseInt(game_payload.rounds))){
            if (response.round_finished){
                running_round++;
                $('.current-round').html(`Round ${running_round} of ${game_payload.rounds}`);
                $('.round-by-round-reaction-header').html(`Round ${running_round} Player Reactions`)
                
            }
        }
        else{
            function most_common_reaction(reactions){
                var r_name = null;
                var f_c = null;
                for (var i of Object.keys(reactions)){
                    if (f_c === null || reactions[i] > f_c){
                        f_c = reactions[i];
                        r_name = i;
                    }
                }
                return r_name;
            }
            var reaction_counts = {1:{}, 2:{}};
            for (var i of round_by_round_results){
                reaction_counts[1][i.a1_reaction] = i.a1_reaction in reaction_counts[1] ? reaction_counts[1][i.a1_reaction] + 1 : 1;
                reaction_counts[2][i.a2_reaction] = i.a2_reaction in reaction_counts[2] ? reaction_counts[2][i.a2_reaction] + 1 : 1;
            }
            console.log('final response payload view')
            console.log(response);
            console.log(reaction_counts)
            var game_over_template = parseInt(response.a1_total_score) === parseInt(response.a2_total_score) ? response_template.game_over_responses.tie : response_template.game_over_responses.non_tie;
            var game_over_personalized = parseInt(player_role) === parseInt(response.actor_running_winner_id) ? response_template.game_over_personalize.player_wins : response_template.game_over_personalize.player_loses
            var game_over_text = game_over_template.next().format({...response, game_personalize_message:game_over_personalized.next().format().text});
            $('.game-announcement-title').html(all_caps(game_over_text.title));
            $('.game-announcement-body').html(only_start_caps(game_over_text.description));
            $('#message-container1').remove();
            $('#message-container2').remove();
            $("#section-block2").html(`
                <div class="header-section-text">What you need to know</div>
                <div class="what-you-need-to-know">-The ${matrix_payload.actors[1].name} ${past_tense_to_be(matrix_payload.actors[1].name)} mostly ${most_common_reaction(reaction_counts[1])} and the ${matrix_payload.actors[2].name} ${past_tense_to_be(matrix_payload.actors[2].name)} mostly ${most_common_reaction(reaction_counts[2])}.</div>
            `)
        }
    }
    $('body').on('click', '.round-by-round-toggle', function(){
        $('.round-by-round-modal').css('display', 'block');
    });
    $('body').on('click', '.close-round-by-round-modal', function(){
        $('.round-by-round-modal').css('display', 'none');
    });
    function remove_players(){
        $('.display-all-players').css('display', 'block');
        $('.player-roles-container').html('');
        for (var i of Object.keys(roles)){
            for (var role of roles[i]){
                $('.player-roles-container').append(`
                    <div class='player-role-outer' data-uid='${role.id}'>
                        <div class='player-role-name'>${role.name}</div>
                        <div class='side-hashtag'>#${matrix_payload.actors[parseInt(i)].name}</div>
                        <div class='remove-player-button-col'>
                            <div class='remove-player-button' data-uid='${role.id}' data-aid='${i}' data-name='${role.name}'>Remove</div>
                        </div>
                    </div>
                `)
            }
        }
    }
    function pause_game(){
        alert('in pause game')
    }
    function stop_game(){
        $('.game-control-outer[data-control="stop"] .game-control-option').html('Stopping Game...')
        $.ajax({
            url: "/stop-game",
            type: "post",
            data: {payload: JSON.stringify({id:game_payload.id, gpid:gameplay_payload.id})},
            success: function(response) {
                $('.game-control-outer[data-control="stop"] .game-control-option').html('Game Stopped')
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    var game_control_handlers = {remove:remove_players, pause:pause_game, stop:stop_game}
    $('body').on('click', '.game-control-outer', function(){
        game_control_handlers[$(this).data('control')]()
    });
    $('body').on('click', '.message-team', function(){
        message_side = parseInt($(this).data('aid'));
        $('.post-message-outer').css('display', 'block');
        $('.message-compose-field').html(`<span class='side-hashtag' style="display: inline;padding-right:10px;font-size:22px">#${matrix_payload.actors[message_side].name}<span class='message-colon'>:</span></span><span class='message-compose-span' contentEditable="true"></span>`)
        $('.message-compose-span').focus();
    });
    $('body').on('click', '.post-message-button', function(){
        if (message_side != null){
            var message = $('.message-compose-span').html();
            if (message.length > 0){
                $('.post-message-outer').css('display', 'none');
                $.ajax({
                    url: "/game-instructor-message",
                    type: "post",
                    data: {payload: JSON.stringify({id:game_payload.id, gpid:gameplay_payload.id, message:message, actor:message_side})},
                    success: function(response) {
                        message_side = null;
                    },
                    error: function(xhr) {
                        //Do Something to handle error
                    }
                });
            }
        }
    });
    $('body').on('click', '.message-compose-main', function(){
        $('.message-compose-span').focus();
    });
    $('body').on('click', '.close-post-message', function(){
        message_side = null;
        $('.post-message-outer').css('display', 'none');
    });
    $('body').on('click', '.close-player-roles', function(){
        $('.display-all-players').css('display', 'none');
    });
    $('body').on('click', '.remove-player-button', function(){
        var uid = parseInt($(this).data('uid'));
        var side = parseInt($(this).data('aid'))
        var name = $(this).data('name')
        $(`.player-role-outer[data-uid="${uid}"]`).remove();
        roles[side] = roles[side].filter(function(x){return parseInt(x.id) != uid});
        $.ajax({
            url: "/remove-player",
            type: "post",
            data: {payload: JSON.stringify({player_id:uid, player_name:name, id:game_payload.id, gid:gameplay_payload.id, side:side, round:running_round})},
            success: function(response) {

            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    });
});