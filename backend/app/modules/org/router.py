from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.org import service
from app.modules.org.schemas import (
    CampusCreate,
    CampusOut,
    CampusUpdate,
    GroupCreate,
    GroupOut,
    GroupUpdate,
    InstitutionCreate,
    InstitutionOut,
    InstitutionUpdate,
    OrgUnitCreate,
    OrgUnitOut,
    OrgUnitUpdate,
)

router = APIRouter(prefix="/api/v1/org", tags=["Organisation Structure"])

read_dep = require_permission("org:read")
write_dep = require_permission("org:write")


# --------------------------------------------------------------- Group -----

@router.post("/groups", response_model=GroupOut, status_code=201)
async def create_group(payload: GroupCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_group(db, payload)


@router.get("/groups", response_model=list[GroupOut])
async def list_groups(db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.list_groups(db)


@router.get("/groups/{group_id}", response_model=GroupOut)
async def get_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_group(db, group_id)


@router.patch("/groups/{group_id}", response_model=GroupOut)
async def update_group(group_id: str, payload: GroupUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.update_group(db, group_id, payload)


# --------------------------------------------------------- Institution -----

@router.post("/institutions", response_model=InstitutionOut, status_code=201)
async def create_institution(payload: InstitutionCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_institution(db, payload)


@router.get("/institutions", response_model=list[InstitutionOut])
async def list_institutions(
    group_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_institutions(db, group_id)


@router.get("/institutions/{institution_id}", response_model=InstitutionOut)
async def get_institution(institution_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_institution(db, institution_id)


@router.patch("/institutions/{institution_id}", response_model=InstitutionOut)
async def update_institution(institution_id: str, payload: InstitutionUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.update_institution(db, institution_id, payload)


# -------------------------------------------------------------- Campus -----

@router.post("/campuses", response_model=CampusOut, status_code=201)
async def create_campus(payload: CampusCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_campus(db, payload)


@router.get("/campuses", response_model=list[CampusOut])
async def list_campuses(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_campuses(db, institution_id)


@router.get("/campuses/{campus_id}", response_model=CampusOut)
async def get_campus(campus_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_campus(db, campus_id)


@router.patch("/campuses/{campus_id}", response_model=CampusOut)
async def update_campus(campus_id: str, payload: CampusUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.update_campus(db, campus_id, payload)


# ------------------------------------------------------------ Org Unit -----

@router.post("/units", response_model=OrgUnitOut, status_code=201)
async def create_org_unit(payload: OrgUnitCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_org_unit(db, payload)


@router.get("/units", response_model=list[OrgUnitOut])
async def list_org_units(
    campus_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_org_units(db, campus_id)


@router.get("/units/{unit_id}", response_model=OrgUnitOut)
async def get_org_unit(unit_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_org_unit(db, unit_id)


@router.patch("/units/{unit_id}", response_model=OrgUnitOut)
async def update_org_unit(unit_id: str, payload: OrgUnitUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.update_org_unit(db, unit_id, payload)
