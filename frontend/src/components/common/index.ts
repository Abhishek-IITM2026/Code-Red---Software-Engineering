import Button, { ButtonContent } from './Button';
import Card, { CardContent, CardHeader, CardFooter } from './Card';
import Input from './Input';
import Select from './Select';
import Table from './Table';
import Preferences from './Preferences.tsx';
import Filter from './Filter';
import ProtectedRoute, { useRoleRedirect } from './ProtectedRoute';
import Search, { type SearchProps, type SearchField, type SearchConfig } from './Search';
import EmployeeSalaryPortal from './EmployeeSalaryPortal';
import SalarySlipPanel from './SalarySlipPanel';

export {
  Button,
  ButtonContent,
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  Input,
  Select,
  Table,
  Preferences,
  Filter,
  ProtectedRoute,
  useRoleRedirect,
  Search,
  EmployeeSalaryPortal,
  SalarySlipPanel
};

// Re-export types
export type { TableColumn, TableProps } from './Table';
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
export type { InputProps } from './Input';
export type { SelectProps, SelectOption } from './Select';
export type { FilterOption } from './Filter';
export type {PreferencesProps} from './Preferences.tsx';
export type { SearchProps, SearchField, SearchConfig } from './Search';
