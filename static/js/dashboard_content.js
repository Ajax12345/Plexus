$(document).ready(function(){
    //<span class="see-more-desc">see more</span>
    function adjust_content_card_heights(){
        for (var i of document.querySelectorAll('.content-card')){
            var c_path = `#content-description${$(i).data('card')}`;
            if (parseInt($(c_path).css('height').match('\\d+')) > 150){
                var c = null;
                var content = $(c_path).text();
                for (var j = 0; j < content.length; j++){
                    $(c_path).html(`${content.substring(0, j)}...<span class="see-more-desc">see more</span>`)
                    if (parseInt($(c_path).css('height').match('\\d+')) > 150){
                        break;
                    }
                    c = j;
                }
                $(c_path).html(`${content.substring(0, c)}...<span class="see-more-desc">see more</span>`)
            }
        }
    }
    function render_content_block(block){
        if (block === null){
            return '';
        }
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
    var full_content_display = {};
    function display_content_payload(content){
        $('.all-content').html(`<div class='content-outer'></div>`)
        for (var [_id, _name, _desc, _content] of content){
            full_content_display[_id] = {title:_name, desc:_desc, cont:_content};
            $('.content-outer').append(`
                <div class="content-card" data-card="${_id}" id="content-card${_id}">
                    <div class="content-title">${_name}</div>
                    <div style="height:10px"></div>
                    <div class="content-description" id="content-description${_id}">${render_content_block(_desc)}</div>
                    <div style="height:10px"></div>
                    <div class='view-content-outer'>
                        <a href='/content/${_id}' style='text-decoration:none'>
                            <div class="view-content">View</div>
                        </a>
                        <div class='listed-in-store'></div>
                    </div>
                </div>
            `)
        }
    }
    function load_content(){
        $.ajax({
            url: "/get-all-content",
            type: "post",
            data: {payload: ''},
            success: function(response) {
                console.log('content response here')
                console.log(response.content)
                display_content_payload(JSON.parse(response.content))
                adjust_content_card_heights();
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    load_content()
});