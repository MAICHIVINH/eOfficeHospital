import Badge from '../common/Badge'
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from '../../utils/constants'

/**
 * WorkflowStatusBadge - Display workflow status with appropriate color
 * @param {Object} props
 * @param {string} props.status - Workflow status enum value
 * @param {string} props.size - Badge size (xs, sm, md, lg)
 * @returns {JSX.Element}
 */
const WorkflowStatusBadge = ({ status, size = 'sm' }) => {
    if (!status) {
        return <Badge variant="gray">N/A</Badge>
    }

    const label = WORKFLOW_STATUS_LABELS[status] || status
    const color = WORKFLOW_STATUS_COLORS[status] || 'gray'

    // Map workflow colors to Badge variants
    const variantMap = {
        'gray': 'gray',
        'blue': 'info',
        'cyan': 'info',
        'yellow': 'warning',
        'amber': 'warning',
        'orange': 'orange',
        'green': 'success',
        'purple': 'primary',
        'indigo': 'primary',
        'red': 'danger',
        'dark': 'gray',
    }

    const variant = variantMap[color] || 'gray'

    return (
        <Badge variant={variant}>
            {label}
        </Badge>
    )
}

export default WorkflowStatusBadge
