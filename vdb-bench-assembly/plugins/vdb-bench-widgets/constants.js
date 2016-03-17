(function () {
    'use strict';

    angular
        .module('vdb-bench.widgets')
        .constant('D3V', {
            SVG_ELEMENT: 'svg',
            GROUP_ELEMENT: 'g',
            SVG_PATH: 'path',
            SVG_CIRCLE: 'circle',
            SVG_CIRCLE_Y: 'cy',
            SVG_RECTANGLE: 'rect',
            SVG_TRANSFORM: 'transform',
            SVG_DATA_ELEMENT: 'd',
            SVG_TRANSLATE: 'translate',
            SVG_SCALE: 'scale',

            CSS_CLASS: 'class',
            CSS_FILL: 'fill',
            CSS_FILL_OPACITY: 'fill-opacity',
            CSS_WIDTH: 'width',
            CSS_HEIGHT: 'height',
            CSS_SELECTED_CLASS: 'node-selected',

            JS_NO_CHILDREN: '_children',
            JS_CHILDREN: 'children',

            XLINK_NAMESPACE: 'http://www.w3.org/1999/xlink',
            XLINK: 'xlink',
            HTML_XLINK_REF: 'xlink:href',
            HTML_HREF: 'href',
            HTML_X: 'x',
            HTML_X0: 'x0',
            HTML_Y: 'y',
            HTML_Y0: 'y0',
            HTML_WIDTH: 'width',
            HTML_HEIGHT: 'height',
            HTML_RADIUS: 'r',
            HTML_IMAGE: 'image',
            HTML_TEXT: 'text',
            HTML_DX: 'dx',
            HTML_DY: 'dy',
            HTML_TEXT_ANCHOR: 'text-anchor',
            HTML_CLICK: 'click',

            MIDDLE: 'middle',
            NODE: 'node',
            LINK: 'link',
            ID: 'id'
        })
        .constant('HAWTIO_FORM', {
            PROPERTIES: 'properties',
            INPUT_ATTR: 'input-attributes',
            TYPE_AHEAD_DATA: 'typeaheadData',
            TYPE_AHEAD: 'typeahead',
            CONTROLS: 'controls',
            TABS: 'tabs'
        });
})();