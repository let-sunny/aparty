import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // TODO: Send to Sentry when integrated
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //   });
    // }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'monospace',
            backgroundColor: '#000',
            color: '#0f0',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              border: '1px solid #0f0',
              padding: '20px',
              backgroundColor: '#001100',
            }}
          >
            <h2 style={{ marginTop: 0, color: '#f00' }}>ERROR</h2>
            <p style={{ marginBottom: '10px' }}>
              Something went wrong. The application encountered an unexpected error.
            </p>
            {this.state.error && (
              <details style={{ marginBottom: '15px' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>
                  Error Details
                </summary>
                <pre
                  style={{
                    backgroundColor: '#000',
                    padding: '10px',
                    overflow: 'auto',
                    fontSize: '12px',
                    border: '1px solid #333',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0f0',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#333',
                color: '#0f0',
                border: '1px solid #0f0',
                cursor: 'pointer',
                fontFamily: 'monospace',
                marginLeft: '10px',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
