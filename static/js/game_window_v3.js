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
    
});