"""
WasteWise AI - Menu Catalog Repository
Provides unified resolution of menu items, prices, and portion cost parameters
across custom multi-tenant canteen database records and standard seed fallbacks.
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from backend.database import get_db_context
from backend.models import MenuItemModel, DEFAULT_ORG_ID
from src.config import MENU_ITEMS, MENU_ITEM_NAMES


class MenuCatalogItem:
    def __init__(
        self,
        name: str,
        category: str,
        cost_price: float,
        selling_price: float,
        prep_batch_size: int = 20,
        shelf_life_hours: float = 4.0,
        base_demand: int = 50,
        is_custom: bool = False,
    ):
        self.name = name
        self.category = category
        self.cost_price = cost_price
        self.selling_price = selling_price
        self.prep_batch_size = prep_batch_size
        self.shelf_life_hours = shelf_life_hours
        self.base_demand = base_demand
        self.is_custom = is_custom

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "category": self.category,
            "cost_per_portion": self.cost_price,
            "selling_price": self.selling_price,
            "prep_batch_size": self.prep_batch_size,
            "shelf_life_hours": self.shelf_life_hours,
            "base_demand": self.base_demand,
        }


class MenuCatalogRepository:
    """
    Encapsulates tenant-aware menu item queries.
    Priority:
    1. Active records in SQLite MenuItemModel for the specified organization_id.
    2. Fallback to bundled demonstration MENU_ITEMS for default demo operations.
    """

    @classmethod
    def get_items_dict(
        cls,
        organization_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, MenuCatalogItem]:
        effective_org_id = organization_id or DEFAULT_ORG_ID
        items_dict: Dict[str, MenuCatalogItem] = {}

        def _query_db(session: Session):
            query = session.query(MenuItemModel).filter(
                MenuItemModel.active == True,
                MenuItemModel.organization_id == effective_org_id,
            )
            return query.all()

        if db is not None:
            db_items = _query_db(db)
        else:
            with get_db_context() as session:
                db_items = _query_db(session)

        for it in db_items:
            items_dict[it.name] = MenuCatalogItem(
                name=it.name,
                category=it.category,
                cost_price=it.cost_price,
                selling_price=it.selling_price,
                prep_batch_size=it.prep_batch_size or 20,
                shelf_life_hours=it.shelf_life_hours or 4.0,
                base_demand=it.base_demand or 50,
                is_custom=True,
            )

        # Fallback to seed config for any standard dishes not explicitly in DB
        for name, cfg in MENU_ITEMS.items():
            if name not in items_dict:
                items_dict[name] = MenuCatalogItem(
                    name=cfg.name,
                    category=cfg.category,
                    cost_price=cfg.cost_per_portion,
                    selling_price=cfg.selling_price,
                    prep_batch_size=cfg.prep_batch_size,
                    shelf_life_hours=cfg.shelf_life_hours,
                    base_demand=cfg.base_demand,
                    is_custom=False,
                )

        return items_dict

    @classmethod
    def get_item(
        cls,
        menu_item: str,
        organization_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> MenuCatalogItem:
        items = cls.get_items_dict(organization_id=organization_id, db=db)
        if menu_item in items:
            return items[menu_item]
        # Safe universal default for unknown custom dishes
        return MenuCatalogItem(
            name=menu_item,
            category="Custom",
            cost_price=40.0,
            selling_price=60.0,
            prep_batch_size=20,
            shelf_life_hours=4.0,
            base_demand=50,
            is_custom=True,
        )
