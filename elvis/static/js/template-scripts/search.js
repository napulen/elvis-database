
$(document).ready(function ($)
{
    $('.input-group-addon').tooltip();
    $('.selectpicker').selectpicker();
    autocomplete("namefilt", "namefilt-suggestions", "composerSuggest", 'bool');
    autocomplete("tagfilt", "tagfilt-suggestions", "tagSuggest", 'bool');
    autocomplete("genrefilt", "genrefilt-suggestions", "genreSuggest", 'bool');
    autocomplete("instrumentfilt", "instrumentfilt-suggestions", "instrumentSuggest", 'bool');
    autocomplete("sourcesfilt", "sourcesfilt-suggestions", "sourceSuggest", 'bool');
    autocomplete("locationsfilt", "locationsfilt-suggestions", "locationSuggest", 'bool');
    autocomplete("gsearch-input", "general-search-suggestions", "generalSuggest", 'bool');
    queryQString();

    //Do a search for the query string when the page back button is hit.
    $(window).bind('popstate', function ()
    {
        queryQString();
    });

    //Submit the form and unfocus the asearch button when clicked.
    $("#asearch-submit").click(function ()
    {
        $(this).blur();
        $('#advanced-search-form').submit();

    });

    $(".asearch-input").on('keydown', function (event)
    {
        if (event['keyCode'] === 13)
        {
            $('#advanced-search-form').submit();
        }
    });
    $("#gsearch-input").on('keydown', function (event)
    {
        if (event['keyCode'] === 13)
        {
            $('#general-search-form').submit();
        }
    });

    //Process advanced search form, and do a query based on it's contents.
    $('#advanced-search-form').submit(function (event)
    {
        event.preventDefault();
        var data = $.parseParams($(this).serialize());
        data['typefilt'] = $("#typefilt").val();
        data['filefilt'] = $("#filefilt").val();
        data['sortby'] = $("#sortby").val();
        data['vocalizationfilt'] = $("#vocalizationfilt").val();
        data['religiosityfilt'] = $("#religiosityfilt").val();
        for (var key in data)
        {
            if (data[key] === "" || data[key] === null)
            {
                delete data[key]
            }
        }
        doQuery(data);
        $('html, body').animate({
            scrollTop: $("#result-count").offset().top - 10
        }, 1000);
    });

    //Submit the form and unfocus the gsearch button when clicked.
    $("#gsearch-submit").click(function ()
    {
        $(this).blur();
        $('#general-search-form').submit();
    });

    //Do a query or clear page based on general-search input.
    $('#general-search-form').submit(function (event)
    {
        event.preventDefault();
        var input = $("#gsearch-input").val();
        doQuery({'q': input});
    });

    //Search for the query parameters in the url via ajax and fill in the input fields to match the search.
    function queryQString(fadewindow)
    {
        fadewindow = typeof fadewindow !== 'undefined' ? fadewindow : "result-page";

        var qstr = window.location.search.replace("?", "");
        var qstr_params = $.parseParams(qstr);
        var keys = Object.keys(qstr_params);
        if (qstr)
        {
            for (var i = 0; i < keys.length; i++)
            {
                if (keys[i] === 'typefilt[]')
                {
                    $('#typefilt').selectpicker('val', qstr_params[keys[i]]);
                    continue;
                }
                if (keys[i] === 'filefilt[]')
                {
                    $('#filefilt').selectpicker('val', qstr_params[keys[i]]);
                    continue;
                }
                if (keys[i] === 'vocalizationfilt')
                {
                    $('#vocalizationfilt').selectpicker('val', qstr_params[keys[i]]);
                    continue;
                }
                if (keys[i] === 'religiosityfilt')
                {
                    $('#religiosityfilt').selectpicker('val', qstr_params[keys[i]]);
                    continue;
                }
                if (keys[i] === 'sortby')
                {
                    $('#sortby').selectpicker('val', qstr_params[keys[i]]);
                    continue;
                }

                $("[name=" + keys[i] + "]").val(qstr_params[keys[i]]);
            }
            doQuery(qstr_params, false, fadewindow)
        }
        else
        {
            $("#result-page").fadeOut(300)
        }
    }

    //Push a string of the ajax search to the browser history so back and forward buttons work.
    function pushToHistory(data, results)
    {
        var query = "?";
        var keys = Object.keys(data);
        for (var i in keys)
        {
            if (typeof data[keys[i]] !== 'string' && keys[i] !== "page")
            {
                for (var j = 0; j < data[keys[i]].length; j++)
                {
                    query += keys[i] + "=" + data[keys[i]][j] + "&"
                }
            }
            else
            {
                query += keys[i] + "=" + data[keys[i]] + "&"
            }
        }
        query = query.slice(0, -1);
        window.history.pushState(results, "Search", "/search/" + query);
    }

    //Send an ajax request for the given data. Write the returned data to the page
    //and push the query parameters to the browser history.
    function doQuery(data, push_to_history, fadewindow)
    {
        push_to_history = typeof push_to_history !== 'undefined' ? push_to_history : true;
        fadewindow = typeof fadewindow !== 'undefined' ? fadewindow : "result-page";

        $.ajax(
            {
                type: "get",
                url: "/search/",
                data: data,
                success: function (results)
                {
                    if (push_to_history)
                    {
                        pushToHistory(data, results)
                    }

                    $("#" + fadewindow).fadeOut(300, function() { drawResults(results); }).fadeIn(300, function(){cartButtonRefresh();});
                }
            });
    }

    //Write the results of a query to the page (including drawing paginators and facets)
    function drawResults(results)
    {
        // Code to handle the "add to cart" button
        var $addAllToCartButton = $("#add-all-to-cart");
        $addAllToCartButton.removeAttr("disabled");
        $addAllToCartButton.click(function(event) {
            $.ajax({
                url: "/search/add-to-cart/?" + results["query"],
                success: function(result) {
                    // Redraw the add to cart buttons
                    //draw_download_buttons();
                    //cartButtonRefresh();
                    init_cart_buttons(true);
                }
            });
            // Disable the button
            $addAllToCartButton.attr({"disabled": "disabled"})
        });

        var $results = $("#search-results-list");
        $results.html("");
        $("#page-links").html("");
        $("#accordion-facets").html("");

        if (results['object_list'] === undefined || results['object_list'].length === 0)
        {
            $("#result-heading").hide();
            $("#no-result-heading").show();
            return false;
        }
        else
        {
            $("#no-result-heading").hide();
            $("#result-count").text(results['paginator']['count']);
            $("#result-heading").show();
        }

        //Add in ajax call to check if piece is in cart.

        for (var key = 0; key < results['object_list'].length; key++)
        {
            var entry = results['object_list'][key];
            if (entry['type'] === "elvis_composer")
            {
                // The string for an unknown date
                const UNKNOWN = "Unknown";

                if (entry['birth_date'])
                    var birthday = entry['birth_date'].slice(0, 4);
                else
                    birthday = UNKNOWN;

                if (entry['death_date'])
                    var death = entry['death_date'].slice(0, 4);
                else
                    death = UNKNOWN;

                // If birthday and deathday are unknown, we just print "unknown"
                if (birthday == UNKNOWN && death == UNKNOWN) {
                    var lifeString = UNKNOWN;
                } else {
                    // We know either the birth or death
                    lifeString = birthday + "-" + death;
                }

                $results.append("<div class='row search-result-row row-eq-height'>" +
                    "<div class='col-xs-1 search-result-add' id='result-list-add" + key + "'><div id='add" + key + "'></div></div>" +
                    "<a href='/composer/" + entry['id'] + "' id='result-list-item" + key + "' class='search-result-item col-xs-11'>" +
                    "<span class='label label-default right-label'>Composer</span><h4>" + entry['name'] + "</h4>" +
                    "<p class='list-group-item-text'>" + lifeString + "</p>" +
                    "</a></div>");
                create_download_form("elvis_composer", entry['uuid'], "add" + key);
                continue;
            }
            if (entry['type'] === "elvis_collection")
            {
                $results.append("<div class='row search-result-row row-eq-height'>" +
                    "<div class='col-xs-1 search-result-add' id='result-list-add" + key + "'><div id='add" + key + "'></div></div>" +
                    "<a href='/collection/" + entry['id'] + "' id='result-list-item" + key + "' class='search-result-item col-xs-11'>" +
                    "<span class='label label-info right-label' style='margin-top:10px'>Collection</span><h4>" + entry['title'] + "</h4>" +
                    "<p class='list-group-item-text'>Created By: " + entry['creator_name'] + " on " + entry['created'].substring(0, 10) + "</p>" +
                    "</a></div>");
                create_download_form("elvis_collection", entry['uuid'], "add" + key);
                continue;
            }
            if (entry['type'] === "elvis_movement")
            {
                if (entry['composition_end_date'])
                    var end_date = entry['composition_end_date'].slice(0, 4);
                else
                    var end_date = "Unknown";

                var result = "<div class='row search-result-row row-eq-height'>" +
                    "<div class='col-xs-1 search-result-add' id='result-list-add" + key + "'><div id='add" + key + "'></div></div>" +
                    "<a href='/movement/" + entry['id'] + "' id='result-list-item" + key + "' class='search-result-item col-xs-11'>" +
                    "<span class='label label-primary right-label'>Movement</span><h4>" + entry['title'] + "</h4>";
                if (entry['parent_piece_name'] !== undefined)
                {
                    result += "<p class='list-group-item-text'> Piece: " + entry['parent_piece_name'] + "</p>";
                }
                result += "<p class='list-group-item-text'> Composer: " + entry['composer_name'] + "</p>" +
                    "<p class='list-group-item-text'> Date: " + end_date + "</p>";
                if (entry['tags'] !== undefined)
                {
                    result += "<p class='list-group-item-text'> Tags: " + entry['tags'] + "</p>";
                }
                result += "</a></div>";
                $results.append(result);
                create_download_form("elvis_movement", entry['uuid'], "add" + key);
                continue;
            }
            if (entry['type'] === "elvis_piece")
            {
                if (entry['composition_end_date'])
                    var end_date = entry['composition_end_date'].slice(0, 4);
                else
                    var end_date = "Unknown";
                var result = "<div class='row search-result-row row-eq-height'>" +
                    "<div class='col-xs-1 search-result-add' id='result-list-add" + key + "'><div id='add" + key + "'></div></div>" +
                    "<a href='/piece/" + entry['id'] + "' id='result-list-item" + key + "' class='search-result-item col-xs-11'>" +
                    "<span class='label label-success right-label'>Piece</span><h4> " + entry['title'] + "</h4>" +
                    "<p class='list-group-item-text'> Composer: " + entry['composer_name'] + "</p>" +
                    "<p class='list-group-item-text'> Date: " + end_date + "</p>";
                if (entry['tags'] !== undefined)
                {
                    result += "<p class='list-group-item-text'> Tags: " + entry['tags'] + "</p>";
                }
                result += "</a></div>";
                $results.append(result);
                create_download_form("elvis_piece", entry['uuid'], "add" + key);
                continue;
            }
        }
        drawPageLinks(results);
        drawFacets(results);
        init_cart_buttons(true);
    }

    //Draw the paginators at the bottom of the page.
    function drawPageLinks(results)
    {
        var $page_links = $("#page-links");
        var links = "<ul class='pagination'>";
        if (results['object_list'] === undefined)
        {
            $page_links.html("");
            return false
        }
        if (results['number'] === 1)
        {
            links += "<li class='disabled'><a href='first' onClick='return false;' id='first-button'>First</a></li>";
            links += "<li class='disabled'><a href='previous' onClick='return false;' id='previous-button'>Previous</a></li>";
        }
        else
        {
            links += "<li><a href='first' onClick='return false;' id='first-button'>First</a></li>";
            links += "<li><a href='previous' onClick='return false;' id='previous-button'>Previous</a></li>";
        }
        links += "<li class='disabled'><a href='#' onClick='return false;'>Page " + results['number'] + " of " + results['paginator']['total_pages'] + "</a></li>";
        if (results['number'] === results['paginator']['total_pages'])
        {
            links += "<li class='disabled'><a href='next' onClick='return false;' id='next-button'>Next</a></li>";
            links += "<li class='disabled'><a href='last' onClick='return false;' id='  last-button'> Last </a></li>";
        }
        else
        {
            links += "<li><a href='next' onClick='return false;' id='next-button'>Next</a></li>";
            links += "<li><a href='last' onClick='return false;' id='last-button'> Last </a></li>";
        }
        links += "</ul>";
        $page_links.html(links);

        $("#first-button").click(function (event)
        {
            if (!$(this.parentElement).hasClass("disabled"))
            {
                var qstr_params = $.parseParams(window.location.search.replace("?", ""));
                delete qstr_params['page'];
                doQuery(qstr_params, true)
            }
        });
        $("#previous-button").click(function (event)
        {
            if (!$(this.parentElement).hasClass("disabled"))
            {
                var qstr_params = $.parseParams(window.location.search.replace("?", ""));
                qstr_params['page'] = results['number'] - 1;
                doQuery(qstr_params, true);
            }
        });
        $("#next-button").click(function (event)
        {
            if (!$(this.parentElement).hasClass("disabled"))
            {
                var qstr_params = $.parseParams(window.location.search.replace("?", ""));
                qstr_params['page'] = results['number'] + 1;
                doQuery(qstr_params, true);
            }
        });
        $("#last-button").click(function (event)
        {
            if (!$(this.parentElement).hasClass("disabled"))
            {
                var qstr_params = $.parseParams(window.location.search.replace("?", ""));
                qstr_params['page'] = results['paginator']['total_pages'];
                doQuery(qstr_params, true);
            }
        });
    }

    //Draw the facets.
    function drawFacets(results)
    {
        var $facet_DOM = $("#accordion-facets");
        var keys = ['type', 'composer_name', 'number_of_voices', 'tags'];
        var facets = results['facets']['facet_fields'];
        var facet_containers = "";
        for (var i in keys)
        {
            if (Object.keys(facets[keys[i]]).length === 0)
                continue;

            var name = keys[i];
            var facet_head = "<div class='panel panel-default'>" +
                "<div class='panel-heading facets'>" +
                "<h3 class='panel-title facets' data-toggle='collapse' data-target='#collapse-" + name + "'>" +
                results['facet_names'][keys[i]] +
                "</h3>" +
                "</div>";
            var facet_body = "<div id='collapse-" + name + "' class='panel-collapse collapse facets in'>" +
                "<div class='panel-body facets' id='facet-panel-" + name + "'>";
            var key_list = Object.keys(facets[keys[i]]).sort();
            for (var j in key_list)
            {
                var facet_list = facets[keys[i]];
                var key_title = key_list[j];
                if (keys[i] === "type")
                    var facet_name = key_title.slice(6)[0].toUpperCase() + key_title.slice(7);
                else
                    var facet_name = key_title;
                facet_body += "<div class='facet-list'>" +
                    "<div id='facet-" + keys[i] + "-" + encodeName(key_title) + "' class='facet-wrapper'>" +
                    "<label class='facet-label' for='facet-link-" + encodeName(j) + "-" + keys[i] + "'>" +
                    "<input type='checkbox' class='facet-link' style='margin: 4px 4px 0' data-facet-name='" + keys[i] +
                    "' data-facet-value='" + encodeName(key_title) + "' id='facet-link-" + encodeName(key_title) + "-" + keys[i] + "'>" +
                    facet_name + "  (" + facet_list[key_title] + ")" +
                    "</label>" +
                    "</div>" +
                    "</div>";
            }
            facet_body += "</div></div></div>";
            facet_containers += facet_head + facet_body;
        }
        $facet_DOM.html(facet_containers);

        var qstr = window.location.search.replace("?", "");
        var qstr_params = $.parseParams(qstr);
        var keys = Object.keys(qstr_params);

        for (var j = 0; j < keys.length; j++)
        {
            if (typeof qstr_params[keys[j]] === 'object')
            {
                $.each(qstr_params[keys[j]], function (val)
                {
                    $("input[data-facet-name='" + keys[j] + "'][id='facet-link-" + encodeName(qstr_params[keys[j]][val]) + "-" + keys[j] + "']").attr('checked', true);
                });
            }
            else
            {
                $("input[data-facet-name='" + keys[j] + "'][id='facet-link-" + encodeName(qstr_params[keys[j]]) + "-" + keys[j] + "']").attr('checked', true);
            }
        }


        $(".facet-link").on('click', function (event)
        {

            var facetName = $(this).data('facet-name');
            var facetValue = $(this).data('facet-value');

            if ($(this).is(':checked'))
            {
                qstr = window.location.search.replace("?", "");
                qstr += "&" + (facetName) + "=" + (facetValue);
                window.history.pushState(results, "Search", "/search/?" + qstr);
                queryQString("search-results-list");
            }
            else
            {
                qstr = window.location.search.replace("?", "");
                qstr = qstr.replace("&" + facetName + "=" + facetValue, "");
                window.history.pushState(results, "Search", "/search/?" + qstr);
                queryQString("search-results-list");
            }
        });
    }

    function draw_download_buttons()
    {
        var $forms = $(".recursive-patch-download-form");
        var items = [];
        for (var i = 0; i < $forms.size(); i++)
        {
            items.push({type: $forms[i][0]['value'], id: $forms[i][1]['value'], num: i})
        }
        $.ajax({
            url: "/download-cart/",
            data: {check_in_cart: JSON.stringify(items)},
            success: function (data)
            {
                console.log(data);
                for (var i = 0; i < $forms.size(); i++)
                {
                    if (data[i]['in_cart'] === "Piece")
                    {
                        $($forms[i]).prepend('<button type="button" class="btn btn-mini btn-info disabled" data-container="body" data-toggle="tooltip" data-placement="top" title="Movement in Downloads under parent Piece. Remove Piece to modify."><span class="glyphicon glyphicon-lock"> </span> </button>');
                        continue;
                    }
                    if (data[i]['in_cart'] === true)
                    {
                        $($forms[i].children[2]).val("remove");
                        $($forms[i]).prepend('<button type="button" class="btn btn-mini btn-danger cart-badge" data-container="body" data-toggle="tooltip" data-placement="top" title="Remove from Downloads"><span class="glyphicon glyphicon-minus"> </span> </button>');
                        continue
                    }
                    if (data[i]['in_cart'] === false)
                    {
                        $($forms[i]).prepend('<button type="button" class="btn btn-mini btn-success cart-badge" data-container="body" data-toggle="tooltip" data-placement="top" title="Add to Downloads"><span class="glyphicon glyphicon-plus"> </span> </button> ');
                    }
                }
            }
        });
    }

    // A slightly more robust version of the encodeURIComponent function.
    function encodeName(name)
    {
        var result = encodeURI(name);
        result = result.replace("'", "%27");
        return result
    }

    $("#datefiltt, #datefiltf ").keypress(function (event)
    {
        if (event.which !== 0 && event.which !== 8)
        {
            if (this.value.length > 3 || (event.which < 48 || event.which > 57))
            {
                return false
            }
        }
    });

});
