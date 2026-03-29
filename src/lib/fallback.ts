import { TownModel } from '@/types';

// Indianapolis, Indiana — 1200 S Meridian St area, used as demo
// Coordinates: 39.7684, -86.1581
export const DEMO_TOWN_MODEL: TownModel = {
  center: { lat: 39.7684, lng: -86.1581 },
  bounds: {
    north: 39.7756,
    south: 39.7612,
    east: -86.1501,
    west: -86.1661,
  },
  buildings: [
    // Residential neighborhood — NW quadrant
    { id: 'b1',  centroid: { lat: 39.7739, lng: -86.1643 }, polygon: [[39.7737,-86.1647],[39.7737,-86.1639],[39.7741,-86.1639],[39.7741,-86.1647]], type: 'residential', levels: 1, material: 'wood', area_sqm: 150 },
    { id: 'b2',  centroid: { lat: 39.7734, lng: -86.1628 }, polygon: [[39.7732,-86.1632],[39.7732,-86.1624],[39.7736,-86.1624],[39.7736,-86.1632]], type: 'residential', levels: 1, material: 'wood', area_sqm: 135 },
    { id: 'b3',  centroid: { lat: 39.7744, lng: -86.1618 }, polygon: [[39.7742,-86.1622],[39.7742,-86.1614],[39.7746,-86.1614],[39.7746,-86.1622]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b4',  centroid: { lat: 39.7729, lng: -86.1648 }, polygon: [[39.7727,-86.1652],[39.7727,-86.1644],[39.7731,-86.1644],[39.7731,-86.1652]], type: 'residential', levels: 1, material: 'wood', area_sqm: 155 },
    { id: 'b5',  centroid: { lat: 39.7724, lng: -86.1633 }, polygon: [[39.7722,-86.1637],[39.7722,-86.1629],[39.7726,-86.1629],[39.7726,-86.1637]], type: 'residential', levels: 1, material: 'wood', area_sqm: 145 },
    { id: 'b6',  centroid: { lat: 39.7749, lng: -86.1638 }, polygon: [[39.7747,-86.1642],[39.7747,-86.1634],[39.7751,-86.1634],[39.7751,-86.1642]], type: 'residential', levels: 1, material: 'wood', area_sqm: 130 },
    { id: 'b7',  centroid: { lat: 39.7719, lng: -86.1623 }, polygon: [[39.7717,-86.1627],[39.7717,-86.1619],[39.7721,-86.1619],[39.7721,-86.1627]], type: 'residential', levels: 1, material: 'wood', area_sqm: 160 },
    { id: 'b8',  centroid: { lat: 39.7754, lng: -86.1625 }, polygon: [[39.7752,-86.1629],[39.7752,-86.1621],[39.7756,-86.1621],[39.7756,-86.1629]], type: 'residential', levels: 1, material: 'wood', area_sqm: 148 },

    // Residential — NE quadrant
    { id: 'b9',  centroid: { lat: 39.7744, lng: -86.1553 }, polygon: [[39.7742,-86.1557],[39.7742,-86.1549],[39.7746,-86.1549],[39.7746,-86.1557]], type: 'residential', levels: 1, material: 'wood', area_sqm: 142 },
    { id: 'b10', centroid: { lat: 39.7734, lng: -86.1538 }, polygon: [[39.7732,-86.1542],[39.7732,-86.1534],[39.7736,-86.1534],[39.7736,-86.1542]], type: 'residential', levels: 1, material: 'wood', area_sqm: 138 },
    { id: 'b11', centroid: { lat: 39.7749, lng: -86.1523 }, polygon: [[39.7747,-86.1527],[39.7747,-86.1519],[39.7751,-86.1519],[39.7751,-86.1527]], type: 'residential', levels: 1, material: 'wood', area_sqm: 155 },
    { id: 'b12', centroid: { lat: 39.7729, lng: -86.1568 }, polygon: [[39.7727,-86.1572],[39.7727,-86.1564],[39.7731,-86.1564],[39.7731,-86.1572]], type: 'residential', levels: 1, material: 'wood', area_sqm: 132 },
    { id: 'b13', centroid: { lat: 39.7724, lng: -86.1553 }, polygon: [[39.7722,-86.1557],[39.7722,-86.1549],[39.7726,-86.1549],[39.7726,-86.1557]], type: 'residential', levels: 1, material: 'wood', area_sqm: 150 },
    { id: 'b14', centroid: { lat: 39.7754, lng: -86.1548 }, polygon: [[39.7752,-86.1552],[39.7752,-86.1544],[39.7756,-86.1544],[39.7756,-86.1552]], type: 'residential', levels: 1, material: 'wood', area_sqm: 145 },

    // Commercial strip — center along main road
    { id: 'b15', centroid: { lat: 39.7684, lng: -86.1623 }, polygon: [[39.7680,-86.1631],[39.7680,-86.1615],[39.7688,-86.1615],[39.7688,-86.1631]], type: 'commercial', levels: 2, material: 'brick', area_sqm: 480 },
    { id: 'b16', centroid: { lat: 39.7684, lng: -86.1598 }, polygon: [[39.7680,-86.1606],[39.7680,-86.1590],[39.7688,-86.1590],[39.7688,-86.1606]], type: 'commercial', levels: 2, material: 'brick', area_sqm: 520 },
    { id: 'b17', centroid: { lat: 39.7684, lng: -86.1573 }, polygon: [[39.7680,-86.1581],[39.7680,-86.1565],[39.7688,-86.1565],[39.7688,-86.1581]], type: 'commercial', levels: 1, material: 'brick', area_sqm: 380 },
    { id: 'b18', centroid: { lat: 39.7684, lng: -86.1548 }, polygon: [[39.7680,-86.1556],[39.7680,-86.1540],[39.7688,-86.1540],[39.7688,-86.1556]], type: 'commercial', levels: 2, material: 'brick', area_sqm: 460 },

    // SW residential
    { id: 'b19', centroid: { lat: 39.7644, lng: -86.1643 }, polygon: [[39.7642,-86.1647],[39.7642,-86.1639],[39.7646,-86.1639],[39.7646,-86.1647]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b20', centroid: { lat: 39.7649, lng: -86.1623 }, polygon: [[39.7647,-86.1627],[39.7647,-86.1619],[39.7651,-86.1619],[39.7651,-86.1627]], type: 'residential', levels: 1, material: 'wood', area_sqm: 130 },
    { id: 'b21', centroid: { lat: 39.7634, lng: -86.1633 }, polygon: [[39.7632,-86.1637],[39.7632,-86.1629],[39.7636,-86.1629],[39.7636,-86.1637]], type: 'residential', levels: 1, material: 'wood', area_sqm: 145 },
    { id: 'b22', centroid: { lat: 39.7639, lng: -86.1618 }, polygon: [[39.7637,-86.1622],[39.7637,-86.1614],[39.7641,-86.1614],[39.7641,-86.1622]], type: 'residential', levels: 1, material: 'wood', area_sqm: 138 },
    { id: 'b23', centroid: { lat: 39.7629, lng: -86.1608 }, polygon: [[39.7627,-86.1612],[39.7627,-86.1604],[39.7631,-86.1604],[39.7631,-86.1612]], type: 'residential', levels: 1, material: 'wood', area_sqm: 152 },
    { id: 'b24', centroid: { lat: 39.7654, lng: -86.1608 }, polygon: [[39.7652,-86.1612],[39.7652,-86.1604],[39.7656,-86.1604],[39.7656,-86.1612]], type: 'residential', levels: 1, material: 'wood', area_sqm: 135 },

    // SE residential
    { id: 'b25', centroid: { lat: 39.7634, lng: -86.1563 }, polygon: [[39.7632,-86.1567],[39.7632,-86.1559],[39.7636,-86.1559],[39.7636,-86.1567]], type: 'residential', levels: 1, material: 'wood', area_sqm: 142 },
    { id: 'b26', centroid: { lat: 39.7649, lng: -86.1543 }, polygon: [[39.7647,-86.1547],[39.7647,-86.1539],[39.7651,-86.1539],[39.7651,-86.1547]], type: 'residential', levels: 1, material: 'wood', area_sqm: 148 },
    { id: 'b27', centroid: { lat: 39.7629, lng: -86.1533 }, polygon: [[39.7627,-86.1537],[39.7627,-86.1529],[39.7631,-86.1529],[39.7631,-86.1537]], type: 'residential', levels: 1, material: 'wood', area_sqm: 139 },
    { id: 'b28', centroid: { lat: 39.7644, lng: -86.1521 }, polygon: [[39.7642,-86.1525],[39.7642,-86.1517],[39.7646,-86.1517],[39.7646,-86.1525]], type: 'residential', levels: 1, material: 'wood', area_sqm: 155 },
    { id: 'b29', centroid: { lat: 39.7634, lng: -86.1508 }, polygon: [[39.7632,-86.1512],[39.7632,-86.1504],[39.7636,-86.1504],[39.7636,-86.1512]], type: 'residential', levels: 1, material: 'wood', area_sqm: 130 },

    // Indianapolis Medical Center (hospital)
    { id: 'b30', centroid: { lat: 39.7619, lng: -86.1581 }, polygon: [[39.7611,-86.1595],[39.7611,-86.1567],[39.7627,-86.1567],[39.7627,-86.1595]], type: 'hospital', levels: 3, material: 'concrete', area_sqm: 3200 },

    // Eagle Creek Elementary (school)
    { id: 'b31', centroid: { lat: 39.7667, lng: -86.1613 }, polygon: [[39.7662,-86.1623],[39.7662,-86.1603],[39.7672,-86.1603],[39.7672,-86.1623]], type: 'school', levels: 1, material: 'brick', area_sqm: 1800 },

    // Meridian Hills Elementary
    { id: 'b32', centroid: { lat: 39.7709, lng: -86.1581 }, polygon: [[39.7704,-86.1591],[39.7704,-86.1571],[39.7714,-86.1571],[39.7714,-86.1591]], type: 'school', levels: 1, material: 'brick', area_sqm: 1600 },

    // Industrial / warehouse area
    { id: 'b33', centroid: { lat: 39.7669, lng: -86.1653 }, polygon: [[39.7664,-86.1663],[39.7664,-86.1643],[39.7674,-86.1643],[39.7674,-86.1663]], type: 'industrial', levels: 1, material: 'steel', area_sqm: 2200 },
    { id: 'b34', centroid: { lat: 39.7659, lng: -86.1648 }, polygon: [[39.7654,-86.1658],[39.7654,-86.1638],[39.7664,-86.1638],[39.7664,-86.1658]], type: 'industrial', levels: 1, material: 'steel', area_sqm: 1900 },

    // More residential fill
    { id: 'b35', centroid: { lat: 39.7699, lng: -86.1643 }, polygon: [[39.7697,-86.1647],[39.7697,-86.1639],[39.7701,-86.1639],[39.7701,-86.1647]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b36', centroid: { lat: 39.7704, lng: -86.1628 }, polygon: [[39.7702,-86.1632],[39.7702,-86.1624],[39.7706,-86.1624],[39.7706,-86.1632]], type: 'residential', levels: 1, material: 'wood', area_sqm: 135 },
    { id: 'b37', centroid: { lat: 39.7709, lng: -86.1613 }, polygon: [[39.7707,-86.1617],[39.7707,-86.1609],[39.7711,-86.1609],[39.7711,-86.1617]], type: 'residential', levels: 1, material: 'wood', area_sqm: 148 },
    { id: 'b38', centroid: { lat: 39.7699, lng: -86.1568 }, polygon: [[39.7697,-86.1572],[39.7697,-86.1564],[39.7701,-86.1564],[39.7701,-86.1572]], type: 'residential', levels: 1, material: 'wood', area_sqm: 142 },
    { id: 'b39', centroid: { lat: 39.7704, lng: -86.1551 }, polygon: [[39.7702,-86.1555],[39.7702,-86.1547],[39.7706,-86.1547],[39.7706,-86.1555]], type: 'residential', levels: 1, material: 'wood', area_sqm: 137 },
    { id: 'b40', centroid: { lat: 39.7714, lng: -86.1533 }, polygon: [[39.7712,-86.1537],[39.7712,-86.1529],[39.7716,-86.1529],[39.7716,-86.1537]], type: 'residential', levels: 1, material: 'wood', area_sqm: 155 },
    { id: 'b41', centroid: { lat: 39.7659, lng: -86.1578 }, polygon: [[39.7657,-86.1582],[39.7657,-86.1574],[39.7661,-86.1574],[39.7661,-86.1582]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b42', centroid: { lat: 39.7654, lng: -86.1561 }, polygon: [[39.7652,-86.1565],[39.7652,-86.1557],[39.7656,-86.1557],[39.7656,-86.1565]], type: 'residential', levels: 1, material: 'wood', area_sqm: 135 },
    { id: 'b43', centroid: { lat: 39.7664, lng: -86.1545 }, polygon: [[39.7662,-86.1549],[39.7662,-86.1541],[39.7666,-86.1541],[39.7666,-86.1549]], type: 'residential', levels: 1, material: 'wood', area_sqm: 145 },
    { id: 'b44', centroid: { lat: 39.7674, lng: -86.1528 }, polygon: [[39.7672,-86.1532],[39.7672,-86.1524],[39.7676,-86.1524],[39.7676,-86.1532]], type: 'residential', levels: 1, material: 'wood', area_sqm: 150 },
    { id: 'b45', centroid: { lat: 39.7649, lng: -86.1588 }, polygon: [[39.7647,-86.1592],[39.7647,-86.1584],[39.7651,-86.1584],[39.7651,-86.1592]], type: 'residential', levels: 1, material: 'wood', area_sqm: 138 },
    { id: 'b46', centroid: { lat: 39.7694, lng: -86.1588 }, polygon: [[39.7692,-86.1592],[39.7692,-86.1584],[39.7696,-86.1584],[39.7696,-86.1592]], type: 'residential', levels: 1, material: 'wood', area_sqm: 143 },
    { id: 'b47', centroid: { lat: 39.7614, lng: -86.1613 }, polygon: [[39.7612,-86.1617],[39.7612,-86.1609],[39.7616,-86.1609],[39.7616,-86.1617]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b48', centroid: { lat: 39.7617, lng: -86.1553 }, polygon: [[39.7615,-86.1557],[39.7615,-86.1549],[39.7619,-86.1549],[39.7619,-86.1557]], type: 'residential', levels: 1, material: 'wood', area_sqm: 132 },

    // Fire station
    { id: 'b49', centroid: { lat: 39.7689, lng: -86.1511 }, polygon: [[39.7685,-86.1519],[39.7685,-86.1503],[39.7693,-86.1503],[39.7693,-86.1519]], type: 'fire_station', levels: 1, material: 'concrete', area_sqm: 600 },

    // More commercial
    { id: 'b50', centroid: { lat: 39.7614, lng: -86.1523 }, polygon: [[39.7610,-86.1531],[39.7610,-86.1515],[39.7618,-86.1515],[39.7618,-86.1531]], type: 'commercial', levels: 2, material: 'brick', area_sqm: 720 },
  ],
  roads: [
    {
      id: 'r1',
      name: 'S Meridian St',
      geometry: [
        [39.7684, -86.1663], [39.7684, -86.1613], [39.7684, -86.1581], [39.7684, -86.1533], [39.7684, -86.1501]
      ],
      type: 'primary'
    },
    {
      id: 'r2',
      name: 'W Washington St',
      geometry: [
        [39.7756, -86.1581], [39.7739, -86.1581], [39.7684, -86.1581], [39.7639, -86.1581], [39.7612, -86.1581]
      ],
      type: 'primary'
    },
    {
      id: 'r3',
      name: 'S Illinois St',
      geometry: [
        [39.7729, -86.1663], [39.7729, -86.1623], [39.7729, -86.1581], [39.7729, -86.1533], [39.7729, -86.1501]
      ],
      type: 'secondary'
    },
    {
      id: 'r4',
      name: 'W Maryland St',
      geometry: [
        [39.7756, -86.1633], [39.7729, -86.1633], [39.7684, -86.1633], [39.7649, -86.1633], [39.7612, -86.1633]
      ],
      type: 'secondary'
    },
    {
      id: 'r5',
      name: 'S Senate Ave',
      geometry: [
        [39.7756, -86.1533], [39.7739, -86.1533], [39.7684, -86.1533], [39.7639, -86.1533], [39.7612, -86.1533]
      ],
      type: 'secondary'
    },
    {
      id: 'r6',
      name: 'Blackford St',
      geometry: [
        [39.7739, -86.1663], [39.7739, -86.1581], [39.7739, -86.1501]
      ],
      type: 'residential'
    },
    {
      id: 'r7',
      name: 'S Capitol Ave',
      geometry: [
        [39.7639, -86.1663], [39.7639, -86.1581], [39.7639, -86.1501]
      ],
      type: 'residential'
    },
    {
      id: 'r8',
      name: 'W Georgia St',
      geometry: [
        [39.7756, -86.1603], [39.7729, -86.1603], [39.7684, -86.1603], [39.7649, -86.1603], [39.7612, -86.1603]
      ],
      type: 'residential'
    },
    {
      id: 'r9',
      name: 'W Ohio St',
      geometry: [
        [39.7756, -86.1561], [39.7729, -86.1561], [39.7684, -86.1561], [39.7649, -86.1561], [39.7612, -86.1561]
      ],
      type: 'residential'
    },
    {
      id: 'r10',
      name: 'S Missouri St',
      geometry: [
        [39.7704, -86.1663], [39.7704, -86.1581], [39.7704, -86.1501]
      ],
      type: 'residential'
    },
    {
      id: 'r11',
      name: 'S West St',
      geometry: [
        [39.7659, -86.1663], [39.7659, -86.1581], [39.7659, -86.1501]
      ],
      type: 'residential'
    },
  ],
  infrastructure: [
    { id: 'i1', type: 'hospital',      name: 'Indianapolis Medical Center',   position: { lat: 39.7619, lng: -86.1581 }, capacity: 200 },
    { id: 'i2', type: 'school',        name: 'Eagle Creek Elementary',         position: { lat: 39.7667, lng: -86.1613 }, capacity: 400 },
    { id: 'i3', type: 'school',        name: 'Meridian Hills Elementary',      position: { lat: 39.7709, lng: -86.1581 }, capacity: 350 },
    { id: 'i4', type: 'fire_station',  name: 'Indianapolis Fire Station #1',   position: { lat: 39.7689, lng: -86.1511 }, capacity: 20  },
    { id: 'i5', type: 'shelter',       name: 'Indianapolis Community Center',  position: { lat: 39.7749, lng: -86.1581 }, capacity: 500 },
    { id: 'i6', type: 'shelter',       name: 'IPS High School Gym',            position: { lat: 39.7614, lng: -86.1523 }, capacity: 800 },
  ],
  population_estimate: 8500,
};
