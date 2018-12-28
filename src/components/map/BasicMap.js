import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defaults as defaultInteractions } from 'ol/interaction';

import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

import OLMap from 'ol/Map';
import OLCollection from 'ol/Collection';
import View from 'ol/View';
import Interaction from 'ol/interaction/Interaction';
import Layer from '../../Layer';

proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 '
  + '+lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel '
  + '+towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs');

register(proj4);

const propTypes = {
  /** Map animation options */
  animationOptions: PropTypes.shape({
    center: PropTypes.arrayOf(PropTypes.number),
    resolution: PropTypes.number,
    zoom: PropTypes.number,
  }),
  /** Center of the ol.View. */
  center: PropTypes.arrayOf(PropTypes.number),
  /** Class name of the map container */
  className: PropTypes.string,
  /** Map extent */
  extent: PropTypes.arrayOf(PropTypes.number),
  /** Openlayers fit options (https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#fit) when extent is updated */
  fitOptions: PropTypes.shape(),
  /** Array of [ol/interaction]. */
  interactions: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.instanceOf(Interaction)),
    PropTypes.instanceOf(OLCollection),
  ]),
  /** Array of Layer to display. */
  layers: PropTypes.arrayOf(PropTypes.instanceOf(Layer)),
  /** An existing [ol/Map](https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html). */
  map: PropTypes.instanceOf(OLMap),
  /**
   * Callback when a [ol/Feature](https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html) is clicked.
   * @param {OLFeature[]} features An array of [ol/Feature](https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html).
   */
  onFeaturesClick: PropTypes.func,
  /**
   * Callback when a [ol/Feature](https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html) is hovered.
   * @param {OLFeature[]} features An array of [ol/Feature](https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html).
   */
  onFeaturesHover: PropTypes.func,
  /**
   * Callback when the map was moved.
   * @param {ol.MapEvent} [evt](https://openlayers.org/en/latest/apidoc/module-ol_MapEvent-MapEvent.html).
   */
  onMapMoved: PropTypes.func,
  /** Map resolution */
  resolution: PropTypes.number,
  /** Map zoom level */
  zoom: PropTypes.number,
};

const defaultProps = {
  animationOptions: undefined,
  center: [0, 0],
  className: 'tm-map',
  extent: undefined,
  fitOptions: {
    duration: 1000,
    padding: [20, 20, 20, 20],
    maxZoom: 23,
  },
  interactions: null,
  layers: [],
  map: null,
  onFeaturesClick: () => {},
  onFeaturesHover: undefined,
  onMapMoved: () => {},
  resolution: undefined,
  zoom: 19,
};

/**
 * Display an OpenLayers Map.
 *
 * The map's view is created with the following parameters for the view:
 *  - projection: 'EPSG:21781'
 *  - zoom: 19
 *  - minZoom: 16
 *  - maxZoom: 22
 *
 */
class BasicMap extends Component {
  constructor(props) {
    super(props);
    const {
      center,
      extent,
      map,
      interactions,
      layers,
      onMapMoved,
      resolution,
      zoom,
    } = this.props;

    this.map = map || new OLMap({
      controls: [],
      interactions: interactions || defaultInteractions(),
    });
    const view = new View({
      center,
      minZoom: 16,
      maxZoom: 22,
      projection: 'EPSG:21781',
    });

    this.map.setView(view);

    if (zoom) {
      view.setZoom(zoom);
    }
    if (resolution) {
      view.setResolution(resolution);
    }
    window.map = this.map;

    this.node = React.createRef();

    if (layers.length) {
      this.setLayers(layers);
    }

    if (extent) {
      this.map.getView().fit(extent);
    }

    this.map.on('moveend', e => onMapMoved(e));
  }

  componentDidMount() {
    const { onFeaturesClick, onFeaturesHover } = this.props;
    this.map.setTarget(this.node.current);

    this.map.on('singleclick', (evt) => {
      const features = evt.map.getFeaturesAtPixel(evt.pixel);
      onFeaturesClick(features || []);
    });

    if (onFeaturesHover) {
      this.map.on('pointermove', (evt) => {
        const features = this.map.getFeaturesAtPixel(evt.pixel);
        onFeaturesHover(features || []);
      });
    }
  }

  componentDidUpdate(prevProps) {
    const {
      animationOptions,
      center,
      extent,
      fitOptions,
      layers,
      resolution,
      zoom,
    } = this.props;

    if (animationOptions
      && prevProps.animationOptions !== animationOptions) {
      this.map.getView().animate(animationOptions);
    }

    if (prevProps.layers !== layers) {
      this.setLayers(layers);
    }

    if (prevProps.center !== center) {
      this.map.getView().setCenter(center);
    }

    if (prevProps.extent !== extent) {
      this.map.getView().fit(extent, fitOptions);
    }

    if (prevProps.zoom !== zoom) {
      this.map.getView().setZoom(zoom);
    }

    if (prevProps.resolution !== resolution
      && this.map.getView().getResolution() !== resolution) {
      this.map.getView().setResolution(resolution);
    }
  }

  setLayers(layers) {
    this.map.getLayers().clear();
    for (let i = 0; i < layers.length; i += 1) {
      layers[i].init(this.map);
    }
  }

  render() {
    const { className } = this.props;
    /**
     * Negative tabindex allows to set an element’s focus with script,
     * but does not put it in the tab order of the page.
     */
    return (
      <div tabIndex="-1" role="menu" ref={this.node} className={className} />
    );
  }
}

BasicMap.propTypes = propTypes;
BasicMap.defaultProps = defaultProps;

export default BasicMap;