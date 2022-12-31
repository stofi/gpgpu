import CustomMaterial from '../materials/CustomMaterial'

export default function Sphere(props: { color?: string }) {
  return (
    <mesh castShadow position-y={1}>
      <sphereGeometry args={[1, 12, 8]} />
      <CustomMaterial color={props.color} />
    </mesh>
  )
}
