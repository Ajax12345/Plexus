$(document).ready(function(){
    function adjust_content_card_heights(){
        for (var i of document.querySelectorAll('.content-card')){
            var c_path = `#content-description${$(i).data('card')}`;
            if (parseInt($(c_path).css('height').match('\\d+')) > 250){
                var c = null;
                var content = $(c_path).text();
                for (var j = 0; j < content.length; j++){
                    $(c_path).html(`${content.substring(0, j)}...<span class="see-more-desc">see more</span>`)
                    if (parseInt($(c_path).css('height').match('\\d+')) > 250){
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
            last_ind = end;
        }
        build_string += block.text.substring(last_ind);
        return build_string
    }
    function display_matrix_payload(payload){
        $('.all-matrices').html(`<div class='content-outer'></div`);
        //<span class='matrix-actor'>#Police</span>, <span class='matrix-actor'>#Protestors</span>
        for (var i of payload){
            $('.content-outer').append(`
                <div class="content-card" data-card="${i.id}" id="content-card${i.id}">
                    <div class='content-title'>${i.name}</div>
                    <div style='height:10px'></div>
                    <div class='matrix-actor-header'>Actors</div>
                    <div style='height:5px'></div>
                    <div class='matrix-actor-outer'>${Object.keys(i.actors).map(function(x){return `<span class='matrix-actor'>#${i.actors[x].name}</span>`}).join(', ')}</div>
                    <div style='height:10px'></div>
                    <div class='content-description' id='content-description${i.id}'>${render_content_block(i.dsc)}</div>
                    <div style='height:12px'></div>    
                    <div class='view-content-outer'>
                        <a href='/matrix/${i.id}' style='text-decoration:none'>
                            <div class="view-content">View</div>
                        </a>
                        <div class='listed-in-store'></div>
                    </div>
                </div>
            `);
        }
    }
    function load_content(){
        $.ajax({
            url: "/get-all-matrices",
            type: "post",
            data: {payload: ''},
            success: function(response) {
                console.log('matrix response here')
                console.log(JSON.parse(response.matrices))
                display_matrix_payload(JSON.parse(response.matrices))
                adjust_content_card_heights();
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    load_content();
});