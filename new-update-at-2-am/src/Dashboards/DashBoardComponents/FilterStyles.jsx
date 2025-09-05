import { styled } from '@mui/material/styles';
import { TextField, Select, FormControl } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export const FilterTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: '42px',
    '& input': {
      padding: '8px 14px',
      fontSize: '0.875rem',
    },
    '& fieldset': {
      borderRadius: theme.shape.borderRadius,
    },
  },
  '& .MuiInputLabel-outlined': {
    transform: 'translate(14px, 12px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -6px) scale(0.75)',
    },
  },
}));

export const FilterSelect = styled(Select)(({ theme }) => ({
  height: '42px',
  '& .MuiSelect-select': {
    padding: '8px 14px',
    fontSize: '0.875rem',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: theme.shape.borderRadius,
  },
}));

export const FilterFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiInputLabel-outlined': {
    transform: 'translate(14px, 12px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -6px) scale(0.75)',
    },
  },
}));

export const FilterDatePicker = styled(DatePicker)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: '42px',
    '& input': {
      padding: '8px 14px',
      fontSize: '0.875rem',
    },
  },
})); 