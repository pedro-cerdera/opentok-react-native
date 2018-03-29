import React, { Component, Children, cloneElement } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { setNativeEvents, OT } from './OT';
import { sanitizeSessionEvents, sanitizeSignalData } from './helpers/OTSessionHelper';
import { logOT } from './helpers/OTHelper';
import { handleError } from './OTError';

export default class OTSession extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sessionInfo: null,
    };
  }
  componentWillMount() {
    const sessionEvents = sanitizeSessionEvents(this.props.eventHandlers);
    setNativeEvents(sessionEvents);
    this.createSession();
    logOT(this.props.apiKey, this.props.sessionId);    
  }
  componentDidUpdate(previousProps) {
    const useDefault = (value, defaultValue) => (value === undefined ? defaultValue : value);
    const shouldUpdate = (key, defaultValue) => {
      const previous = useDefault(previousProps[key], defaultValue);
      const current = useDefault(this.props[key], defaultValue);
      return previous !== current;
    };

    const updateSessionProperty = (key, defaultValue) => {
      if (shouldUpdate(key, defaultValue)) {
        const value = useDefault(this.props[key], defaultValue);
        const signalData = sanitizeSignalData(value);
        OT.sendSignal(signalData, signalData.errorHandler);
      }
    };

    updateSessionProperty('signal', {});
  }
  componentWillUnmount() {
    this.disconnectSession();
  }
  createSession() {
    OT.initSession(this.props.apiKey, this.props.sessionId);    
    OT.connect(this.props.token, (error) => {
      if (error) {
        handleError(error);
      } else {
        OT.getSessionInfo((sessionInfo) => {
          this.setState({
            sessionInfo,
          });
          const signalData = sanitizeSignalData(this.props.signal);
          OT.sendSignal(signalData, signalData.errorHandler);
        });
      }
    });
  }
  disconnectSession() {
    OT.disconnectSession((disconnectError) => {
      if (disconnectError) {
        this.setState({
          sessionInfo: null,
        });
      } else {
        handleError(error);
      }
    });
  }
  getSessionInfo() {
    return this.state.sessionInfo;
  }
  render() {
    if (this.props.children) {
      const childrenWithProps = Children.map(
        this.props.children,
        child => (child ? cloneElement(
          child,
          {
            sessionId: this.props.sessionId,
          },
        ) : child),
      );
      return <View>{ childrenWithProps }</View>;
    }
    return <View />;
  }
}

OTSession.propTypes = {
  apiKey: PropTypes.string.isRequired,
  sessionId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
  eventHandlers: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  signal: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

OTSession.defaultProps = {
  eventHandlers: {},
  signal: {},
};
