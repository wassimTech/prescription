# SOLID in React/TypeScript — Patterns & Examples

## S — Single Responsibility

**Bad**: One component fetches, filters, and renders a list.

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState("")
  useEffect(() => { fetch("/api/users").then(...) }, [])
  const filtered = users.filter(u => u.name.includes(filter))
  return (
    <div>
      <input onChange={e => setFilter(e.target.value)} />
      {filtered.map(u => <div key={u.id}>{u.name}</div>)}
    </div>
  )
}
```

**Good**: Hook owns data, component owns UI.

```tsx
function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers);
  }, []);
  return users;
}

function UserFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}

function UserList() {
  const users = useUsers();
  const [filter, setFilter] = useState("");
  return (
    <div>
      <UserFilter value={filter} onChange={setFilter} />
      {users
        .filter((u) => u.name.includes(filter))
        .map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
    </div>
  );
}
```

---

## O — Open/Closed

**Bad**: Fork the component for each variant.

```tsx
function PrimaryButton({ label }: { label: string }) { ... }
function DangerButton({ label }: { label: string }) { ... }  // ← copy-paste
```

**Good**: Extend via props.

```tsx
type Variant = "primary" | "danger" | "ghost";

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-blue-600 text-white",
  danger: "bg-red-600 text-white",
  ghost: "bg-transparent border",
};

function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return <button className={cn(variantClass[variant], className)} {...rest} />;
}
```

---

## L — Liskov Substitution

**Bad**: `IconButton` breaks consumers expecting a standard button.

```tsx
// Consumer passes onClick — but IconButton ignores it
function IconButton({ icon }: { icon: React.ReactNode }) {
  return <button>{icon}</button>; // onClick dropped
}
```

**Good**: Extend the native interface, spread rest.

```tsx
interface IconButtonProps extends React.ComponentProps<"button"> {
  icon: React.ReactNode;
  label: string; // for a11y
}

function IconButton({ icon, label, ...rest }: IconButtonProps) {
  return (
    <button aria-label={label} {...rest}>
      {icon}
    </button>
  );
}
```

---

## I — Interface Segregation

**Bad**: Giant prop bag — consumers must pass irrelevant props.

```tsx
interface CardProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string; // only meaningful when imageUrl is set
  badge?: string;
  badgeColor?: string; // only meaningful when badge is set
}
```

**Good**: Discriminated union — only valid combinations compile.

```tsx
type CardMedia =
  | { media: "image"; src: string; alt: string }
  | { media: "icon"; icon: React.ReactNode }
  | { media: "none" };

interface CardBadge {
  label: string;
  color: "green" | "red" | "blue";
}

interface CardProps {
  title: string;
  subtitle?: string;
  media: CardMedia;
  badge?: CardBadge;
}
```

---

## D — Dependency Inversion

**Bad**: Presentational component hard-codes a side effect.

```tsx
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function DeleteButton({ id }: { id: string }) {
  async function handleClick() {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    router.push("/items");
  }
  return <button onClick={handleClick}>Delete</button>;
}
```

**Good**: Inject behavior via props; component stays portable.

```tsx
interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  label?: string;
}

function DeleteButton({ onDelete, label = "Delete" }: DeleteButtonProps) {
  return <button onClick={onDelete}>{label}</button>;
}

// In the page/container:
<DeleteButton
  onDelete={async () => {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    router.push("/items");
  }}
/>;
```

---

## Quick Reference

| Principle | React smell                                     | Fix                                |
| --------- | ----------------------------------------------- | ---------------------------------- |
| S         | Component does fetch + render + form            | Split into hook + sub-components   |
| O         | `if (isSpecialCase)` in shared component        | Add a variant prop                 |
| L         | Sub-component drops props from parent interface | Spread `...rest` onto root element |
| I         | Props that only apply together                  | Use discriminated union            |
| D         | Imports toast/router/analytics directly         | Accept callback props instead      |
