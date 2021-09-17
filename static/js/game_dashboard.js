$(document).ready(function(){
    $('body').on('click', '.copy-game-link', function(){
        $('.copy-game-tooltip').html('Link copied')
        setTimeout(function(){
            $('.copy-game-tooltip').remove();
        }, 700);
    });
    var display_tooltip = false;
    var game_payload = null;
    $(document).on({
        mouseenter: function () {
            display_tooltip = true;
            var _this = this;
            setTimeout(function(){
                if (display_tooltip){
                    var t = _this.offsetTop;
                    var l = _this.offsetLeft;
                    //var h = parseInt($(_this).css('height').match('\\d+'));
                    $('body').append(`<div class='copy-game-tooltip'>Copy link</div>`);
                    //var _h1 = parseInt($('.copy-game-tooltip').css('height').match('\\d+'));
                    $('.copy-game-tooltip').css('top', t - 4);
                    $('.copy-game-tooltip').css('left', l+25);
                    
                }
            }, 500);
        },
        mouseleave: function () {
            display_tooltip = false;
            $('.copy-game-tooltip').remove();
        }
    }, ".copy-game-link"); 
    $('body').on('click', '.nav-entry', function(){
        if (!$(this).hasClass('nav-entry-selected')){
            $('.nav-entry').each(function(){
                $(this).removeClass('nav-entry-selected');
            });
            $(this).addClass('nav-entry-selected');
        }
    });
    $(document).on({
        mouseenter: function () {
            
            var t = this.offsetTop;
            var l = this.offsetLeft;
            var h = parseInt($(this).css('height').match('\\d+'));
            $('body').append(`<div class='about-block-tooltip'>${$(this).data('tooltip')}</div>`);
            var h1 = parseInt($('.about-block-tooltip').css('height').match('\\d+'));
            $('.about-block-tooltip').css('top', t-(h1-h)/2);
            $('.about-block-tooltip').css('left', l+25);
                
        },
        mouseleave: function () {
            $('.about-block-tooltip').remove();
        }
    }, ".tooltip-info"); 
    $('body').on('click', '.edit-entries', function(){
        $('.entry-control-edit').html(`<div class='save-edits save-edits-disabled'>Save</div>`);
        $('.cancel-edit').css('display', 'block')
        $('.game-setting-field').each(function(){
            $(this).removeClass('game-setting-field-disabled')
            $(this).attr('readonly', false)
        });
    });
    $('body').on('click', '.cancel-edit', function(){
        $('.entry-control-edit').html(`
            <div class='edit-entries'>
                <div>Edit</div>
                <div class='edit-entry'></div>
            </div>
        `);
        $('.cancel-edit').css('display', 'none')
        $('.game-setting-field').each(function(){
            $(this).addClass('game-setting-field-disabled')
            $(this).attr('readonly', true)
        });
    });
    $('body').on('click', '.save-edits', function(){
        if (!$(this).hasClass('save-edits-disabled')){
            $('.entry-control-edit').html(`
                <div class='edit-entries'>
                    <div>Edit</div>
                    <div class='edit-entry'></div>
                </div>
            `);
            $('.cancel-edit').css('display', 'none')
            $('.game-setting-field').each(function(){
                $(this).addClass('game-setting-field-disabled')
                $(this).attr('readonly', true)
            });
        }
    });
    function edit_game_name(ref, val){
        $('.save-edits').removeClass('save-edits-disabled')
    }
    function edit_game_rounds(ref, val){
        if (parseInt(val) < 1){
            $(ref).val('1')
        }
        $('.save-edits').removeClass('save-edits-disabled')
    }
    var _edit_id_bindings = {1:edit_game_name, 2:edit_game_rounds}
    $('body').on('input', '.game-setting-field', function(){
        _edit_id_bindings[parseInt($(this).data('fid'))](this, $(this).val())
    });
    $('body').on('click', '.game-date-selector', function(){
        $(".dropdown-outer").css('width', $('.all-game-play-dates').css('width'))
        if ($('.dropdown-outer').hasClass('dropdown-outer-toggled')){
            $('.dropdown-outer').removeClass('dropdown-outer-toggled')
        }
        else{
            $('.dropdown-outer').addClass('dropdown-outer-toggled')
        }
    });
    function close_dropdown(elem){
        var flag = false;
        while (elem != null){
            if (['game-date-selector', 'dropdown-outer'].some(function(x){return $(elem).hasClass(x)})){
                flag = true;
            }
            elem = elem.parentNode;
        }
        if (!flag){
            $('.dropdown-outer').removeClass('dropdown-outer-toggled')
        }
    }
    $('body').on('click', function(e){
        close_dropdown(e.target)
    });
    function load_payload(){
        game_payload = $('.game-settings-wrapper').data('payload');
        
    }
    load_payload();
});