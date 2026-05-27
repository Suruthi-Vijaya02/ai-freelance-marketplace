import { Component } from 'react';
import Button from './ui/Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
          <h2 className="font-heading text-2xl text-text mb-2">Something went wrong</h2>
          <p className="text-muted mb-6 max-w-md">An unexpected error occurred. Please try again.</p>
          <Button onClick={this.handleRetry}>Retry</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
