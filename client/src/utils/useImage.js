import useImage from 'use-image'

function pathJoin (parts, sep) {
  const separator = sep || '/'
  const replace = new RegExp(separator + '{1,}', 'g')
  return parts.join(separator).replace(replace, separator)
}

export default function useImageWrapper (...args) {
  args[0] = pathJoin([process.env.PUBLIC_URL, args[0]])
  return useImage(...args)
}
