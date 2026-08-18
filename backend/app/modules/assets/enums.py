from enum import Enum


class AssetClass(str, Enum):
    LAND = "land"
    BUILDING = "building"
    PLANT_MACHINERY = "plant_machinery"
    LAB_EQUIPMENT = "lab_equipment"
    COMPUTERS = "computers"
    FURNITURE = "furniture"
    VEHICLES = "vehicles"
    LIBRARY_BOOKS = "library_books"
    ELECTRICAL = "electrical"
    SPORTS = "sports"


class FundingSource(str, Enum):
    INSTITUTION = "institution"
    GRANT = "grant"
    PROJECT = "project"
    DONATION = "donation"


class DepreciationMethod(str, Enum):
    WDV = "wdv"
    SLM = "slm"


class AssetStatus(str, Enum):
    ACTIVE = "active"
    UNDER_REPAIR = "under_repair"
    TRANSFERRED = "transferred"
    DISPOSED = "disposed"
    WRITTEN_OFF = "written_off"
