import classNames from "classnames";

export const Wire = ({path, on}) => {
  return <path className={classNames("wire", {"on": on === true})} d={path} />
}