import { TownModel } from '@/types';

// Moore, Oklahoma — famous for EF5 tornadoes, used as demo
// Coordinates: 35.3395, -97.4868
export const DEMO_TOWN_MODEL: TownModel = {
  center: { lat: 35.3395, lng: -97.4868 },
  queryRadiusM: 500,
  groundRadiusM: 650,
  bounds: {
    north: 35.3467,
    south: 35.3323,
    east: -97.4788,
    west: -97.4948,
  },
  buildings: [
    // Residential neighborhood — NW quadrant
    { id: 'b1', centroid: { lat: 35.3450, lng: -97.4930 }, polygon: [[35.3448,-97.4934],[35.3448,-97.4926],[35.3452,-97.4926],[35.3452,-97.4934]], type: 'residential', levels: 1, material: 'wood', area_sqm: 150 },
    { id: 'b2', centroid: { lat: 35.3445, lng: -97.4915 }, polygon: [[35.3443,-97.4919],[35.3443,-97.4911],[35.3447,-97.4911],[35.3447,-97.4919]], type: 'residential', levels: 1, material: 'wood', area_sqm: 135 },
    { id: 'b3', centroid: { lat: 35.3455, lng: -97.4905 }, polygon: [[35.3453,-97.4909],[35.3453,-97.4901],[35.3457,-97.4901],[35.3457,-97.4909]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b4', centroid: { lat: 35.3440, lng: -97.4935 }, polygon: [[35.3438,-97.4939],[35.3438,-97.4931],[35.3442,-97.4931],[35.3442,-97.4939]], type: 'residential', levels: 1, material: 'wood', area_sqm: 155 },
    { id: 'b5', centroid: { lat: 35.3435, lng: -97.4920 }, polygon: [[35.3433,-97.4924],[35.3433,-97.4916],[35.3437,-97.4916],[35.3437,-97.4924]], type: 'residential', levels: 1, material: 'wood', area_sqm: 145 },
    { id: 'b6', centroid: { lat: 35.3460, lng: -97.4925 }, polygon: [[35.3458,-97.4929],[35.3458,-97.4921],[35.3462,-97.4921],[35.3462,-97.4929]], type: 'residential', levels: 1, material: 'wood', area_sqm: 130 },
    { id: 'b7', centroid: { lat: 35.3430, lng: -97.4910 }, polygon: [[35.3428,-97.4914],[35.3428,-97.4906],[35.3432,-97.4906],[35.3432,-97.4914]], type: 'residential', levels: 1, material: 'wood', area_sqm: 160 },
    { id: 'b8', centroid: { lat: 35.3465, lng: -97.4912 }, polygon: [[35.3463,-97.4916],[35.3463,-97.4908],[35.3467,-97.4908],[35.3467,-97.4916]], type: 'residential', levels: 1, material: 'wood', area_sqm: 148 },

    // Residential — NE quadrant
    { id: 'b9',  centroid: { lat: 35.3455, lng: -97.4840 }, polygon: [[35.3453,-97.4844],[35.3453,-97.4836],[35.3457,-97.4836],[35.3457,-97.4844]], type: 'residential', levels: 1, material: 'wood', area_sqm: 142 },
    { id: 'b10', centroid: { lat: 35.3445, lng: -97.4825 }, polygon: [[35.3443,-97.4829],[35.3443,-97.4821],[35.3447,-97.4821],[35.3447,-97.4829]], type: 'residential', levels: 1, material: 'wood', area_sqm: 138 },
    { id: 'b11', centroid: { lat: 35.3460, lng: -97.4810 }, polygon: [[35.3458,-97.4814],[35.3458,-97.4806],[35.3462,-97.4806],[35.3462,-97.4814]], type: 'residential', levels: 1, material: 'wood', area_sqm: 155 },
    { id: 'b12', centroid: { lat: 35.3440, lng: -97.4855 }, polygon: [[35.3438,-97.4859],[35.3438,-97.4851],[35.3442,-97.4851],[35.3442,-97.4859]], type: 'residential', levels: 1, material: 'wood', area_sqm: 132 },
    { id: 'b13', centroid: { lat: 35.3435, lng: -97.4840 }, polygon: [[35.3433,-97.4844],[35.3433,-97.4836],[35.3437,-97.4836],[35.3437,-97.4844]], type: 'residential', levels: 1, material: 'wood', area_sqm: 150 },
    { id: 'b14', centroid: { lat: 35.3465, lng: -97.4835 }, polygon: [[35.3463,-97.4839],[35.3463,-97.4831],[35.3467,-97.4831],[35.3467,-97.4839]], type: 'residential', levels: 1, material: 'wood', area_sqm: 145 },

    // Commercial strip — center along main road
    { id: 'b15', centroid: { lat: 35.3395, lng: -97.4910 }, polygon: [[35.3391,-97.4918],[35.3391,-97.4902],[35.3399,-97.4902],[35.3399,-97.4918]], type: 'commercial', levels: 2, material: 'brick', area_sqm: 480 },
    { id: 'b16', centroid: { lat: 35.3395, lng: -97.4885 }, polygon: [[35.3391,-97.4893],[35.3391,-97.4877],[35.3399,-97.4877],[35.3399,-97.4893]], type: 'commercial', levels: 2, material: 'brick', area_sqm: 520 },
    { id: 'b17', centroid: { lat: 35.3395, lng: -97.4860 }, polygon: [[35.3391,-97.4868],[35.3391,-97.4852],[35.3399,-97.4852],[35.3399,-97.4868]], type: 'commercial', levels: 1, material: 'brick', area_sqm: 380 },
    { id: 'b18', centroid: { lat: 35.3395, lng: -97.4835 }, polygon: [[35.3391,-97.4843],[35.3391,-97.4827],[35.3399,-97.4827],[35.3399,-97.4843]], type: 'commercial', levels: 2, material: 'brick', area_sqm: 460 },

    // SW residential
    { id: 'b19', centroid: { lat: 35.3355, lng: -97.4930 }, polygon: [[35.3353,-97.4934],[35.3353,-97.4926],[35.3357,-97.4926],[35.3357,-97.4934]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b20', centroid: { lat: 35.3360, lng: -97.4910 }, polygon: [[35.3358,-97.4914],[35.3358,-97.4906],[35.3362,-97.4906],[35.3362,-97.4914]], type: 'residential', levels: 1, material: 'wood', area_sqm: 130 },
    { id: 'b21', centroid: { lat: 35.3345, lng: -97.4920 }, polygon: [[35.3343,-97.4924],[35.3343,-97.4916],[35.3347,-97.4916],[35.3347,-97.4924]], type: 'residential', levels: 1, material: 'wood', area_sqm: 145 },
    { id: 'b22', centroid: { lat: 35.3350, lng: -97.4905 }, polygon: [[35.3348,-97.4909],[35.3348,-97.4901],[35.3352,-97.4901],[35.3352,-97.4909]], type: 'residential', levels: 1, material: 'wood', area_sqm: 138 },
    { id: 'b23', centroid: { lat: 35.3340, lng: -97.4895 }, polygon: [[35.3338,-97.4899],[35.3338,-97.4891],[35.3342,-97.4891],[35.3342,-97.4899]], type: 'residential', levels: 1, material: 'wood', area_sqm: 152 },
    { id: 'b24', centroid: { lat: 35.3365, lng: -97.4895 }, polygon: [[35.3363,-97.4899],[35.3363,-97.4891],[35.3367,-97.4891],[35.3367,-97.4899]], type: 'residential', levels: 1, material: 'wood', area_sqm: 135 },

    // SE residential
    { id: 'b25', centroid: { lat: 35.3345, lng: -97.4850 }, polygon: [[35.3343,-97.4854],[35.3343,-97.4846],[35.3347,-97.4846],[35.3347,-97.4854]], type: 'residential', levels: 1, material: 'wood', area_sqm: 142 },
    { id: 'b26', centroid: { lat: 35.3360, lng: -97.4830 }, polygon: [[35.3358,-97.4834],[35.3358,-97.4826],[35.3362,-97.4826],[35.3362,-97.4834]], type: 'residential', levels: 1, material: 'wood', area_sqm: 148 },
    { id: 'b27', centroid: { lat: 35.3340, lng: -97.4820 }, polygon: [[35.3338,-97.4824],[35.3338,-97.4816],[35.3342,-97.4816],[35.3342,-97.4824]], type: 'residential', levels: 1, material: 'wood', area_sqm: 139 },
    { id: 'b28', centroid: { lat: 35.3355, lng: -97.4808 }, polygon: [[35.3353,-97.4812],[35.3353,-97.4804],[35.3357,-97.4804],[35.3357,-97.4812]], type: 'residential', levels: 1, material: 'wood', area_sqm: 155 },
    { id: 'b29', centroid: { lat: 35.3345, lng: -97.4795 }, polygon: [[35.3343,-97.4799],[35.3343,-97.4791],[35.3347,-97.4791],[35.3347,-97.4799]], type: 'residential', levels: 1, material: 'wood', area_sqm: 130 },

    // Moore Medical Center (hospital)
    { id: 'b30', centroid: { lat: 35.3330, lng: -97.4868 }, polygon: [[35.3322,-97.4882],[35.3322,-97.4854],[35.3338,-97.4854],[35.3338,-97.4882]], type: 'hospital', levels: 3, material: 'concrete', area_sqm: 3200 },

    // Plaza Towers Elementary (school)
    { id: 'b31', centroid: { lat: 35.3378, lng: -97.4900 }, polygon: [[35.3373,-97.4910],[35.3373,-97.4890],[35.3383,-97.4890],[35.3383,-97.4910]], type: 'school', levels: 1, material: 'brick', area_sqm: 1800 },

    // Briarwood Elementary
    { id: 'b32', centroid: { lat: 35.3420, lng: -97.4870 }, polygon: [[35.3415,-97.4880],[35.3415,-97.4860],[35.3425,-97.4860],[35.3425,-97.4880]], type: 'school', levels: 1, material: 'brick', area_sqm: 1600 },

    // Industrial / warehouse area
    { id: 'b33', centroid: { lat: 35.3380, lng: -97.4940 }, polygon: [[35.3375,-97.4950],[35.3375,-97.4930],[35.3385,-97.4930],[35.3385,-97.4950]], type: 'industrial', levels: 1, material: 'steel', area_sqm: 2200 },
    { id: 'b34', centroid: { lat: 35.3370, lng: -97.4935 }, polygon: [[35.3365,-97.4945],[35.3365,-97.4925],[35.3375,-97.4925],[35.3375,-97.4945]], type: 'industrial', levels: 1, material: 'steel', area_sqm: 1900 },

    // More residential fill
    { id: 'b35', centroid: { lat: 35.3410, lng: -97.4930 }, polygon: [[35.3408,-97.4934],[35.3408,-97.4926],[35.3412,-97.4926],[35.3412,-97.4934]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b36', centroid: { lat: 35.3415, lng: -97.4915 }, polygon: [[35.3413,-97.4919],[35.3413,-97.4911],[35.3417,-97.4911],[35.3417,-97.4919]], type: 'residential', levels: 1, material: 'wood', area_sqm: 135 },
    { id: 'b37', centroid: { lat: 35.3420, lng: -97.4900 }, polygon: [[35.3418,-97.4904],[35.3418,-97.4896],[35.3422,-97.4896],[35.3422,-97.4904]], type: 'residential', levels: 1, material: 'wood', area_sqm: 148 },
    { id: 'b38', centroid: { lat: 35.3410, lng: -97.4855 }, polygon: [[35.3408,-97.4859],[35.3408,-97.4851],[35.3412,-97.4851],[35.3412,-97.4859]], type: 'residential', levels: 1, material: 'wood', area_sqm: 142 },
    { id: 'b39', centroid: { lat: 35.3415, lng: -97.4838 }, polygon: [[35.3413,-97.4842],[35.3413,-97.4834],[35.3417,-97.4834],[35.3417,-97.4842]], type: 'residential', levels: 1, material: 'wood', area_sqm: 137 },
    { id: 'b40', centroid: { lat: 35.3425, lng: -97.4820 }, polygon: [[35.3423,-97.4824],[35.3423,-97.4816],[35.3427,-97.4816],[35.3427,-97.4824]], type: 'residential', levels: 1, material: 'wood', area_sqm: 155 },
    { id: 'b41', centroid: { lat: 35.3370, lng: -97.4865 }, polygon: [[35.3368,-97.4869],[35.3368,-97.4861],[35.3372,-97.4861],[35.3372,-97.4869]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b42', centroid: { lat: 35.3365, lng: -97.4848 }, polygon: [[35.3363,-97.4852],[35.3363,-97.4844],[35.3367,-97.4844],[35.3367,-97.4852]], type: 'residential', levels: 1, material: 'wood', area_sqm: 135 },
    { id: 'b43', centroid: { lat: 35.3375, lng: -97.4832 }, polygon: [[35.3373,-97.4836],[35.3373,-97.4828],[35.3377,-97.4828],[35.3377,-97.4836]], type: 'residential', levels: 1, material: 'wood', area_sqm: 145 },
    { id: 'b44', centroid: { lat: 35.3385, lng: -97.4815 }, polygon: [[35.3383,-97.4819],[35.3383,-97.4811],[35.3387,-97.4811],[35.3387,-97.4819]], type: 'residential', levels: 1, material: 'wood', area_sqm: 150 },
    { id: 'b45', centroid: { lat: 35.3360, lng: -97.4875 }, polygon: [[35.3358,-97.4879],[35.3358,-97.4871],[35.3362,-97.4871],[35.3362,-97.4879]], type: 'residential', levels: 1, material: 'wood', area_sqm: 138 },
    { id: 'b46', centroid: { lat: 35.3405, lng: -97.4875 }, polygon: [[35.3403,-97.4879],[35.3403,-97.4871],[35.3407,-97.4871],[35.3407,-97.4879]], type: 'residential', levels: 1, material: 'wood', area_sqm: 143 },
    { id: 'b47', centroid: { lat: 35.3325, lng: -97.4900 }, polygon: [[35.3323,-97.4904],[35.3323,-97.4896],[35.3327,-97.4896],[35.3327,-97.4904]], type: 'residential', levels: 1, material: 'wood', area_sqm: 140 },
    { id: 'b48', centroid: { lat: 35.3328, lng: -97.4840 }, polygon: [[35.3326,-97.4844],[35.3326,-97.4836],[35.3330,-97.4836],[35.3330,-97.4844]], type: 'residential', levels: 1, material: 'wood', area_sqm: 132 },

    // Fire station
    { id: 'b49', centroid: { lat: 35.3400, lng: -97.4798 }, polygon: [[35.3396,-97.4806],[35.3396,-97.4790],[35.3404,-97.4790],[35.3404,-97.4806]], type: 'fire_station', levels: 1, material: 'concrete', area_sqm: 600 },

    // More commercial
    { id: 'b50', centroid: { lat: 35.3325, lng: -97.4810 }, polygon: [[35.3321,-97.4818],[35.3321,-97.4802],[35.3329,-97.4802],[35.3329,-97.4818]], type: 'commercial', levels: 2, material: 'brick', area_sqm: 720 },
  ],
  roads: [
    {
      id: 'r1',
      name: 'SE 19th Street',
      geometry: [
        [35.3395, -97.4950], [35.3395, -97.4900], [35.3395, -97.4868], [35.3395, -97.4820], [35.3395, -97.4788]
      ],
      type: 'primary'
    },
    {
      id: 'r2',
      name: 'Eastern Ave',
      geometry: [
        [35.3467, -97.4868], [35.3450, -97.4868], [35.3395, -97.4868], [35.3350, -97.4868], [35.3323, -97.4868]
      ],
      type: 'primary'
    },
    {
      id: 'r3',
      name: 'SW 4th Street',
      geometry: [
        [35.3440, -97.4950], [35.3440, -97.4910], [35.3440, -97.4868], [35.3440, -97.4820], [35.3440, -97.4788]
      ],
      type: 'secondary'
    },
    {
      id: 'r4',
      name: 'Moore Ave',
      geometry: [
        [35.3467, -97.4920], [35.3440, -97.4920], [35.3395, -97.4920], [35.3360, -97.4920], [35.3323, -97.4920]
      ],
      type: 'secondary'
    },
    {
      id: 'r5',
      name: 'N Broadway',
      geometry: [
        [35.3467, -97.4820], [35.3450, -97.4820], [35.3395, -97.4820], [35.3350, -97.4820], [35.3323, -97.4820]
      ],
      type: 'secondary'
    },
    {
      id: 'r6',
      name: 'Elm Ave',
      geometry: [
        [35.3450, -97.4950], [35.3450, -97.4868], [35.3450, -97.4788]
      ],
      type: 'residential'
    },
    {
      id: 'r7',
      name: 'Cedar Lane',
      geometry: [
        [35.3350, -97.4950], [35.3350, -97.4868], [35.3350, -97.4788]
      ],
      type: 'residential'
    },
    {
      id: 'r8',
      name: 'Oak Street',
      geometry: [
        [35.3467, -97.4890], [35.3440, -97.4890], [35.3395, -97.4890], [35.3360, -97.4890], [35.3323, -97.4890]
      ],
      type: 'residential'
    },
    {
      id: 'r9',
      name: 'Maple Drive',
      geometry: [
        [35.3467, -97.4848], [35.3440, -97.4848], [35.3395, -97.4848], [35.3360, -97.4848], [35.3323, -97.4848]
      ],
      type: 'residential'
    },
    {
      id: 'r10',
      name: 'SW 8th Street',
      geometry: [
        [35.3415, -97.4950], [35.3415, -97.4868], [35.3415, -97.4788]
      ],
      type: 'residential'
    },
    {
      id: 'r11',
      name: 'NW 12th Street',
      geometry: [
        [35.3370, -97.4950], [35.3370, -97.4868], [35.3370, -97.4788]
      ],
      type: 'residential'
    },
  ],
  waterFeatures: [
    {
      id: 'demo_stream',
      kind: 'line',
      type: 'stream',
      category: 'river',
      geometry: [
        [35.333, -97.4945],
        [35.335, -97.493],
        [35.3375, -97.4915],
        [35.3395, -97.4905],
      ],
    },
    {
      id: 'demo_pond',
      kind: 'area',
      type: 'pond',
      category: 'lake',
      geometry: [
        [35.3418, -97.481],
        [35.3418, -97.4796],
        [35.3432, -97.4796],
        [35.3432, -97.481],
        [35.3418, -97.481],
      ],
    },
  ],
  infrastructure: [
    { id: 'i1', type: 'hospital', name: 'Moore Medical Center', position: { lat: 35.3330, lng: -97.4868 }, capacity: 200 },
    { id: 'i2', type: 'school', name: 'Plaza Towers Elementary', position: { lat: 35.3378, lng: -97.4900 }, capacity: 400 },
    { id: 'i3', type: 'school', name: 'Briarwood Elementary', position: { lat: 35.3420, lng: -97.4870 }, capacity: 350 },
    { id: 'i4', type: 'fire_station', name: 'Moore Fire Station #1', position: { lat: 35.3400, lng: -97.4798 }, capacity: 20 },
    { id: 'i5', type: 'shelter', name: 'Moore Community Center', position: { lat: 35.3460, lng: -97.4868 }, capacity: 500 },
    { id: 'i6', type: 'shelter', name: 'Moore High School Gym', position: { lat: 35.3325, lng: -97.4810 }, capacity: 800 },
  ],
  population_estimate: 8500,
};
