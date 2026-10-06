const styles = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  READY: 'bg-green-100 text-green-800 border-green-300',
  ARCHIVED: 'bg-orange-100 text-orange-700 border-orange-300',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.DRAFT}`}>
      {status}
    </span>
  )
}
