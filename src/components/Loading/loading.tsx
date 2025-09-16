
const Loading = ({message}: {message: string}) => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">{message}</div>
        </div>
    )
}

export default Loading;
