import ErrorDisplay from './error-display';

const Error = () => {
  return (
    <div className="flex h-[calc(100vh-var(--header-height)-var(--footer-height))] w-full items-center justify-center">
      <ErrorDisplay
        title="Error"
        message="Sorry, something went wrong"
        buttonText="Refresh"
        action={() => window.location.reload()}
      />
    </div>
  );
};

export default Error;
