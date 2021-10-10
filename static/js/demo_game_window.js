$(document).ready(function(){
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
    function utc_now(){
        var d = new Date();
        return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
    }
    function update_message_timestamps(){
        for (var i of document.querySelectorAll('.game-message .message-post-datetime')){
            var d1 = $(i).data('posted');
            var d2 = utc_now();
            var factors = [[1000, 'sec'], [1000*60, 'min']];
            var last = null;
            for (var [interval, t] of factors){
                var v = Math.floor((d2 - d1)/interval)
                if (v > 0){
                    last = {val:v, t_int:t};
                }
            }
            if (last != null){
                $(i).html(`${last.val} ${last.t_int}`);
            }

        }
    }
    function run_message_timestamp_updates(){
        setTimeout(function(){
            update_message_timestamps();
            run_message_timestamp_updates();
        }, 60000);
    }
    function on_message_display(mid){
        var o = document.querySelector(`#${mid}`);
        var t = o.offsetTop;
        var l = o.offsetLeft;
        var w = (parseInt($(o).css('width').match('\\d+'))+30).toString()+'px'
        var h = (parseInt($(o).css('height').match('\\d+'))+30).toString()+'px';
        $('body').append(`<div class='message-added-overlay' style='top:${t};left:${l};width:${w};height:${h}'></div>`);
        setTimeout(function(){
            $('.message-added-overlay').addClass('message-on-display');
        
            setTimeout(function(){
                $('.message-added-overlay').removeClass('message-on-display');
                setTimeout(function(){
                    $('.message-added-overlay').remove();
                }, 1000);
            }, 1000);
        
        
        }, 200);
    }
    function post_message(payload, target='#message-container1'){
        var posted_date = utc_now();
        $.ajax({
            url: "/post-message",
            type: "post",
            data: {payload: JSON.stringify({poster:payload.poster, gid:gameplay_payload.id, is_player:payload.is_player, body:payload.body, reply:payload.reply, added:posted_date})},
            success: function(response) {
                var message_id = 'target_m_id' in payload ? payload.target_m_id : `game-message${response.id}`
                $(target).prepend(`<div class="message-main" id='${message_id}' style='margin-top:-100px'>
                    <div class="message-body game-message" data-mid='${response.id}'>
                        <div class="poster-icon-outer">
                            <img class="message-poster-icon" src="https://www.gravatar.com/avatar/e527e2038eb5c6671be2820348cb72b2?d=identicon">
                        </div>
                        <div class="main-message-body">
                            <div class="message-about-poster">
                                <div class="message-poster-name">${payload.name}</div>
                                <div class="message-poster-handle">@${payload.handle}</div>
                                <div class="message-dot"></div>
                                <div class="message-post-datetime" data-posted='${posted_date}'>1 sec</div>
                            </div>
                            <div class="message-body-content">${payload.body}</div>
                            <div class="message-action-footer">
                                <div class="reply-message-outer">
                                    <div class="reply-message-icon"></div>
                                </div>
                                <div class="message-reply-count">0</div>
                                <div></div>
                                <div class="like-message-outer">
                                    <div class="like-message-icon"></div>
                                </div>
                                <div class="message-like-count">0</div>
                            </div>
                        </div>
                    </div>
                </div>`);
                //$(`#${message_id}`).css('margin-top', `-${$(`#${message_id}`).css('height')}`);
                setTimeout(function(){
                    $(`#${message_id}`).css('margin-top', `0px`);
                }, 50);
                
                //on_message_display(message_id);
                
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
        
    }
    function setup_play_stage(){
        player_role = Object.keys(roles).filter(function(x){return roles[x].some(function(y){return parseInt(y.id) === parseInt(user_payload.id)})})[0]
        opponent =  Object.keys(matrix_payload.actors).filter(function(x){return parseInt(x) != parseInt(player_role)})[0]
        console.log('player role')
        console.log(player_role);
        $('.role-container .team-about-large').html('#'+matrix_payload.actors[player_role].name);
        for (var i of document.querySelectorAll('.how-to-play-container how-to-play-desc > .adversary-hashtag')){
            $(i).html('#'+actors[opponent].name);
        }
        $('.side-score-outer:nth-of-type(1) .side-score-name').html(matrix_payload.actors[1].name)
        $('.side-score-outer:nth-of-type(3) .side-score-name').html(matrix_payload.actors[2].name)
        $('.role-container').css('display', 'block');
        $('.how-to-play-container').css('display', 'block')
        $('.score-box').css('display', 'block')
        $('.scoreboard-spacer').css('display', 'block')
        $("#section-block2").html(`
            <div class="message-team-outer">
                <div class="message-team-prompt-outer">
                    <div class="team-messages-text"><span class="side-hashtag side-hashtag-header">#${matrix_payload.actors[player_role].name}</span> messages</div>
                </div>
                <div class="message-button-outer">
                    <div class="add-message">Message</div>
                </div>
            </div>
        `);
        $('.current-round').html(`Round 1 of ${game_payload.rounds}`);
        post_message({poster:10, name:"Protest Game", handle:'protest_game', body:`The game has begun! Your team is <span class="side-hashtag">#${matrix_payload.actors[player_role].name}</span>.`, is_player:0, reply:null})
        var non_start = Object.keys(matrix_payload.actors).filter(function(x){return parseInt(x) != parseInt(matrix_payload.move)})[0]
        var start_template = response_template.round_by_round.start.next().format({first_move_actor:matrix_payload.actors[matrix_payload.move].name, second_move_actor:matrix_payload.actors[non_start].name})
        console.log('start template here')
        console.log(start_template)
        $('.game-announcement-title').html(all_caps(start_template.title));
        $('.game-announcement-body').html(only_start_caps(start_template.description));
        //submit_side_reactions([...choose_reactions(opponent)], opponent);
        if (parseInt(player_role) === parseInt(matrix_payload.move)){
            player_side_move({actor:player_role, body:`<span class="side-hashtag">#${matrix_payload.actors[player_role].name}</span> players: the game has begun. Make your move now!`});
        }
        else{
            opponent_side_move();
        }
    }
    function player_side_move(payload){
        $("#reaction-poll-message").remove();
        $("#wait-for-response").remove();
        $('#message-container1').prepend(`<div class="message-main" id='reaction-poll-message' style='margin-top:-100px'>
            <div class="message-body">
                <div class="poster-icon-outer">
                    <div class="main-game-icon"></div>
                </div>
                <div class="main-message-body">
                    <div class="message-about-poster">
                        <div class="message-poster-name">Instigator</div>
                        <div class="message-poster-handle">@instigator</div>
                        <div class="message-dot"></div>
                        <div class="message-post-datetime">Just now</div>
                    </div>
                    <div class="message-body-content">${payload.body}</div>
                    <div class='reaction-poll-outer'>
                        ${matrix_payload.reactions[payload.actor].map(function(x){
                            return `<div class="reaction-poll-option" data-rid='${x.id}'>${x.reaction}</div>`
                        }).join('\n')}
                    </div>
                    <div class="message-action-footer">
                        <div class="reply-message-outer">
                            <div class="reply-message-icon"></div>
                        </div>
                        <div class="message-reply-count">0</div>
                        <div></div>
                        <div class="like-message-outer">
                            <div class="like-message-icon"></div>
                        </div>
                        <div class="message-like-count">0</div>
                    </div>
                </div>
            </div>
        </div>`);
        setTimeout(function(){
            $(`#reaction-poll-message`).css('margin-top', `0px`);
        }, 50);
    }
    function opponent_side_move(){
        //alert('opponent side move')
        setTimeout(function(){
            submit_side_reactions([...choose_reactions(opponent)], opponent)
        }, 5000)
    }
    function get_random_reaction(side){
        return matrix_payload.reactions[side][Math.floor(Math.random()*matrix_payload.reactions[side].length)].id;
    }
    function* choose_reactions(side){
        for (var x of roles[side]){
            yield {...x, reaction:get_random_reaction(side)}
        }   
    }
    function all_caps(s){
        var ignore = ['a', 'and', 'an', 'the', 'or', 'but', 'yet', 'were', 'was', 'while', 'to']
        return s.replace(/^[a-zA-Z]|(?<=\s)[a-zA-Z]/g, function(match, ...p){
            return !ignore.includes(match) ? match.toUpperCase() : match;
        });
    }
    function only_start_caps(s){
        var actor_names = Object.keys(matrix_payload.actors).map(function(x){return matrix_payload.actors[x].name})
        return s.toLowerCase().replace(/^[a-zA-Z]|(?<=\.\s)[a-zA-Z]/g, function(match, ...p){
            return match.toUpperCase()
        }).replace(/[a-zA-Z]+/g, function(match, ...p){
            return actor_names.includes(match) ? match[0].toUpperCase() + match.substring(1).toLowerCase() : match
        });
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

        }
        if (!response.round_finished || (running_round + 1 <= parseInt(game_payload.rounds))){
            if (response.round_finished){
                running_round++;
                $('.current-round').html(`Round ${running_round} of ${game_payload.rounds}`);
            }
            if (response.actor_move_next_id === player_role){
                setTimeout(function(){
                    player_side_move({actor:player_role, body:`<span class="side-hashtag">#${matrix_payload.actors[player_role].name}</span> players: ${response.a_move} were ${response.reaction}. Make your move now!`});
                }, 500);
            }
            else{
                setTimeout(function(){
                    opponent_side_move();
                }, 500);    
            }
        }
        else{
            alert("game over")
        }
    }
    function submit_side_reactions(reactions, side){
        $.ajax({
            url: "/submit-side-reactions",
            type: "post",
            data: {payload: JSON.stringify({id:game_payload.id, gid:gameplay_payload.id, side:side, reactions:reactions, round:running_round})},
            success: function(response) {
                analyze_reaction_response(JSON.parse(response.response));
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }   
    function assign_player_roles(){
        $.ajax({
            url: "/assign-roles",
            type: "post",
            data: {payload: JSON.stringify({id:game_payload.id, gid:gameplay_payload.id})},
            success: function(response) {
                roles = response.roles;
                console.log(roles)
                setTimeout(function(){
                    setup_play_stage();
                }, 700);
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    function on_content_close(){
        if (!closed_content){
            setTimeout(function(){
                post_message({poster:10, name:"Protest Game", handle:'protest_game', body:'Preparing demo.... The game will begin in a moment.', is_player:0, reply:null})
                setTimeout(function(){
                    assign_player_roles();
                }, 600);
            }, 500);
            closed_content = true;
        }
    }
    $('body').on('click', '.reaction-poll-option', function(){
        if (!$(this.parentNode).hasClass('reaction-poll-disabled')){
            $(this).addClass('reaction-poll-chosen')
            $(this.parentNode).addClass('reaction-poll-disabled');
            var r_id = parseInt($(this).data('rid'));
            post_message({poster:10, name:"Protest Game", handle:'protest_game', body:`Your selection has been recorded. Please wait while the rest of your team submits their choices.`, is_player:0, reply:null, target_m_id:"wait-for-response"})
            setTimeout(function(){
                submit_side_reactions([...choose_reactions(player_role)].map(function(x){
                    return parseInt(x.id) === parseInt(user_payload.id) ? {...x, reaction:r_id} : x
                }), player_role)
            }, 1000);
        }
    });
    $('body').on('click', '.game-content-close-top', function(){
        $('.game-content-modal').css('display', 'none');
        on_content_close()
    });
    $('body').on('click', '.close-content-modal', function(){
        $('.game-content-modal').css('display', 'none');
        on_content_close()
    });
    $('body').on('click', '.content-slide-name', function(){
        if (!$(this).hasClass('content-slide-chosen')){
            var sid = parseInt($(this).data('sid'));
            for (var i of document.querySelectorAll(':is(.content-slide-marker, .content-slide-name)')){
                $(i).removeClass('content-marker-chosen');
                $(i).removeClass('content-slide-chosen');
            }
            $(`.content-slide-name[data-sid="${sid}"]`).addClass('content-slide-chosen');
            $(`.content-slide-marker[data-sid="${sid}"]`).addClass('content-marker-chosen');
            var b = content_payload.content.filter(function(x){return parseInt(x.id) === sid})[0]
            $('.content-slide-title').html(b.title);
            $('.content-slide-body').html(render_content_block(b))
        }
    });
    $('body').on('click', '.content-next-toggle', function(){
        var sid = parseInt($(Array.from(document.querySelectorAll('.content-slide-name')).filter(function(x){return $(x).hasClass('content-slide-chosen')})[0]).data('sid'))
        var inds = [];
        var c = 0;
        var f = false;
        for (var i of content_payload.content){
            if (parseInt(i.id) === sid){
                f = true;
            }
            else if (f){
                inds.push(c);
            }
            c++;
        }
        var n_ind = inds.length === 0 ? 0 : Math.min(...inds);
        for (var i of document.querySelectorAll(':is(.content-slide-marker, .content-slide-name)')){
            $(i).removeClass('content-marker-chosen');
            $(i).removeClass('content-slide-chosen');
        }
        $(`.content-slide-name[data-sid="${content_payload.content[n_ind].id}"]`).addClass('content-slide-chosen');
        $(`.content-slide-marker[data-sid="${content_payload.content[n_ind].id}"]`).addClass('content-marker-chosen'); 
        $('.content-slide-title').html(content_payload.content[n_ind].title);
        $('.content-slide-body').html(render_content_block(content_payload.content[n_ind]))

    });
    $('body').on('click', '.resource-item', function(){
        if ($(this).data('resource') === 'content'){
            $('.game-content-modal').css('display', 'block');
            load_content_modal();
        }
    }); 
    var meta_payload = null;
    var game_payload = null;
    var user_payload = null;
    var content_payload = null;
    var matrix_payload = null;
    var gameplay_payload = null;
    var closed_content = false;
    var roles = null;
    var player_role = null;
    var opponent = null;
    var response_template = null;
    var running_round = 1;
    function render_content_block(block){
        var last_ind = 0;
        var build_string = '';
        for (var {link:l_link, start:_start, end:_end, lid:_lid} of block.links){
            build_string += block.text.substring(last_ind, _start)
            build_string += `<a href='${l_link}' class='content-block-link' id='content-block-link${_lid}' data-lid='${_lid}'>${block.text.substring(_start, _end)}</a>`;
            last_ind = _end;
        }
        build_string += block.text.substring(last_ind);
        return build_string
    }
    function load_content_modal(){
        console.log(content_payload)
        $('.content-slides').html('');
        var c = 0;
        for (var i of content_payload.content){
            $('.content-slides').append(`
            <div class='content-slide-marker ${c === 0 ? "content-marker-chosen" : ""}' data-sid='${i.id}'></div>
            <div class='content-slide-name ${c === 0 ? "content-slide-chosen" : ""}' data-sid='${i.id}'>${i.title}</div>
            `);
            c++;
        }
        $('.content-slide-title').html(content_payload.content[0].title);
        $('.content-slide-body').html(render_content_block(content_payload.content[0]))
    }
    function setup_start_screen(next_step = function(){}){
        $('.user-name-about').html(user_payload.name);
        $('.user-handle-about').html('@'+user_payload.name.replace(' ', '_').toLowerCase());
        $('.game-announcement-title').html(`Protest Set to Occur Between ${matrix_payload.actors[1].name} and ${matrix_payload.actors[2].name}.`);
        $('.game-announcement-body').html(`${matrix_payload.actors[1].name} and ${matrix_payload.actors[2].name} will face off in a pivotal confrontation.`)
        $('.what-you-need-to-know:nth-of-type(2)').html(`-In a moment, you will be assignmed to a team, either <span class="side-hashtag">#${matrix_payload.actors[1].name}</span> or <span class="side-hashtag">#${matrix_payload.actors[2].name}</span>`)
        $('.what-you-need-to-know:nth-of-type(3)').html(`-This game is ${game_payload.rounds} round${game_payload.rounds === 1 ? "" : "s"}. In each round, you and your teammates will choose a reaction as a response to your opponent's reaction`)
        $('.game-content-modal').css('display', 'block');
        load_content_modal();
        next_step();

    }
    function invite_demo_players(){
        $.ajax({
            url: "/invite-demo-players",
            type: "post",
            data: {payload: JSON.stringify({gid:game_payload.id})},
            success: function(response) {
                //pass
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
        
    }
    function load_start(){
        meta_payload = $('.main').data('pld')
        $.ajax({
            url: "/load-full-game-instance",
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
                response_template = payload .response_template;
                ResponseTemplate.templatify(response_template);
                setup_start_screen(function(){
                    $('.game-loading-state-display').css('display', 'none');
                
                });
                invite_demo_players();
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    load_start();
    run_message_timestamp_updates()
});