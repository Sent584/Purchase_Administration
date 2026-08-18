"""Indian statutory payroll rates (EPF, ESI, TN Professional Tax).

These are module-level defaults for FY calculation. Global Config will override
them later via the config_console module — do not hardcode rates elsewhere.
"""

# EPF — Employees' Provident Fund
EPF_EE_RATE = 0.12  # employee contribution
EPF_ER_RATE = 0.12  # employer contribution
EPF_WAGE_CEILING = 15_000.0  # monthly wage ceiling for contribution

# ESI — Employees' State Insurance
ESI_EE_RATE = 0.0075  # 0.75% employee
ESI_ER_RATE = 0.0325  # 3.25% employer
ESI_GROSS_CEILING = 21_000.0  # eligibility if gross <= this

# Tamil Nadu Professional Tax — simplified monthly equivalent of half-yearly slabs
# Monthly salary band → monthly PT deduction
TN_PT_SLABS: list[tuple[float, float]] = [
    (0.0, 0.0),
    (21_000.0, 0.0),
    (30_000.0, 166.0),
    (40_000.0, 208.0),
    (float("inf"), 208.0),
]


def epf_employee(wage: float) -> float:
    base = min(wage, EPF_WAGE_CEILING)
    return round(base * EPF_EE_RATE, 2)


def epf_employer(wage: float) -> float:
    base = min(wage, EPF_WAGE_CEILING)
    return round(base * EPF_ER_RATE, 2)


def esi_employee(gross: float) -> float:
    if gross > ESI_GROSS_CEILING:
        return 0.0
    return round(gross * ESI_EE_RATE, 2)


def esi_employer(gross: float) -> float:
    if gross > ESI_GROSS_CEILING:
        return 0.0
    return round(gross * ESI_ER_RATE, 2)


def tn_professional_tax(monthly_salary: float) -> float:
    prev_ceiling = 0.0
    for ceiling, amount in TN_PT_SLABS:
        if monthly_salary <= ceiling:
            return amount if monthly_salary > prev_ceiling or ceiling == 0 else amount
        prev_ceiling = ceiling
    return 208.0
