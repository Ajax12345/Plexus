$(document).ready(function(){
    $('body').on('click', '.game-content-close-top', function(){
        $('.game-content-modal').css('display', 'none');
    });
    $('body').on('click', '.close-content-modal', function(){
        $('.game-content-modal').css('display', 'none');
    });
    $('body').on('click', '.reaction-poll-option', function(){
        if (!$(this.parentNode).hasClass('reaction-poll-disabled')){
            $(this).addClass('reaction-poll-chosen')
            $(this.parentNode).addClass('reaction-poll-disabled')
        }
    });
    $('body').on('click', '.add-message', function(){
        $('.post-message-outer').css('display', 'block');
        $('.message-compose-field').focus();
    });
    $('body').on('click', '.close-post-message', function(){
        $('.post-message-outer').css('display', 'none');
    });
    function* get_all_message_text(elem){
        if (elem.nodeType === 3){
            yield elem.textContent;
        }
        else if (!$(this).hasClass('message-body-placeholder')){
            for (var i of elem.childNodes){
                yield* get_all_message_text(i);
            }
        }
    }
    function find_handles(message){
        return message.replace(/#\w+|@\w+/g, function(match, ...p){
            return `<span class='side-hashtag'>${match}</span>`
        });
    }
    var hash_flag = false;
    $('body').on('input', '.message-compose-field', function(e){
        var t = Array.from(get_all_message_text(document.querySelector('.message-compose-field'))).join('');
        if (t.length === 0){
            $('.message-compose-field').html(`<div class='message-body-placeholder' style="display: inline;" contentEditable="false">Message your team</div>`)
        }
        else{
            $('.message-body-placeholder').remove();
            var change = false;
            if (e.originalEvent.data === '#'){
                hash_flag = true;
            }
            else if (e.originalEvent.data.match(/[^\w]+/)){
                hash_flag = false;
                change = true;
            }
            if (hash_flag || change){
                t = Array.from(get_all_message_text(document.querySelector('.message-compose-field'))).join('');
                $('.message-compose-field').html(find_handles(t))
                document.querySelector('.message-compose-field').focus();
                document.execCommand('selectAll', false, null);
                document.getSelection().collapseToEnd();
            }
        }
    });
    var walkthrough_steps = {
        path:[1],
        start:1,
        steps:{
            1:{
                elem:'.score-box',
                card:1,
                orient:1,
                next:2,
            }
        },
        cards:{
            1:`<div class='walkthrough-card'>
                    <div class='walkthrough-card-inner'>
                        <div class='w-card-title'>This is the game scoreboard</div>
                        <div style='height:20px'></div>
                        <div class='w-card-desc'>The scoreboard displays the current round and points for both sides during the game.</div>
                        <div style='height:30px'></div>
                        <div class='w-card-nav-outer'>
                            <div class='hide-w-cards-toggle'>
                                <div class='hide-w-card-icon'></div>
                                <div class='hide-w-cards'>Hide these tips</div>
                            </div>
                            <div class='w-next-card-col'><div class='next-card-walkthrough'>Next</div></div>
                        </div>
                    </div>
                    <div class='walkthrough-arrow-1'></div>
                </div>`
        }
    }
    var current_card = null;
    function render_walkthrough_step(s_step){
        $('.walkthrough-card').remove();
        $('.walkthrough-highlight').removeClass('walkthrough-highlight')
        var t_obj = document.querySelector(walkthrough_steps.steps[s_step].elem);
        $(t_obj).addClass('walkthrough-highlight');
        $('body').append(walkthrough_steps.cards[walkthrough_steps.steps[s_step].card]);
        current_card = s_step;
        var t = t_obj.offsetTop;
        var l = t_obj.offsetLeft;
        var w = parseInt($(t_obj).css('width').match('\\d+'));
        var y = parseInt($(t_obj).css('height').match('\\d+'));
        var w1 = parseInt($('.walkthrough-card').css('width').match('\\d+'));
        var y1 = parseInt($('.walkthrough-card').css('height').match('\\d+'));
        if (walkthrough_steps.steps[s_step].orient === 1){
            //arrow tooltip centered vertically on the target
            $('.walkthrough-card').css('left', (l - w1-35).toString());
            var a_obj = document.querySelector(`.walkthrough-arrow-${s_step}`)
            $('.walkthrough-card').css('top', (t+y/2 - parseInt($(a_obj).css('height').match('\\d+'))/2 - 25).toString());

        }

    }
    function start_walkthrough(s_step){
        $('.walkthrough-outer').css('display', 'block');
        render_walkthrough_step(s_step)
    }
    start_walkthrough(1);
});