interface Props {
  search: string
  onSearchChange: (value: string) => void
  status: 'all' | 'active' | 'disabled'
  onStatusChange: (value: 'all' | 'active' | 'disabled') => void
}

export function UsersFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: Props) {
  return (
    <div className="filters-row">
      <input
        className="input"
        placeholder="Search by name, email or phone"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="input"
        value={status}
        onChange={(e) => onStatusChange(e.target.value as Props['status'])}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="disabled">Disabled</option>
      </select>
    </div>
  )
}

