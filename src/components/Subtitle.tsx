type SubtitleProps = {
  french: string
  english: string
  className?: string
  smaller?: boolean
}

export function Subtitle({ french, english, className = '', smaller = false }: SubtitleProps) {
  return (
    <div className={className}>
      <div>{french}</div>
      <div className={`${smaller ? 'text-[10px]' : 'text-xs'} text-gray-400`}>{english}</div>
    </div>
  )
}
