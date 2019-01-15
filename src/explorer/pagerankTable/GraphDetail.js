import React from "react";
import {DynamicAdapterSet} from "../adapters/adapterSet";
import type {DynamicAppAdapter} from "../adapters/appAdapter";
import sortBy from "lodash.sortby";
import {FALLBACK_NAME} from "../../analysis/fallbackDeclaration";
import {type NodeAddressT, NodeAddress} from "../../core/graph";

type GrapphDetailProps = {|
  +pnd: PagerankNodeDecomposition,
  +dynamicAdapterSet: DynamicAdapterSet,
|}

export function logGraphDetail(props) {
  const { pnd, dynamicAdapterSet } = props;

  /*
  graphDetail = {
    "git:": {
        "commits":
          "totalNodes": 91,
          "totalCred": 245
      }
    }
  */
  var graphDetail = {
    'adapters': {}
  };

  const allNodes = Array.from(pnd.keys())
  const adapters = Array.from(dynamicAdapterSet.adapters())
  .filter((a) => a.static().declaration().name !== FALLBACK_NAME)

  const indent = "   "
  var totalProjectCred = 0;

  adapters.forEach((adapter) => {
    const adapterType = adapter.static().declaration().name
    const nodeTypes = adapter.static().declaration().nodeTypes
    //console.log(adapterType)

    var totalAdapterCred = 0;
    var totalAdapterNodes = 0;

    graphDetail.adapters[adapterType] = {
      'totalNodes': 0,
      'totalCred': 0,
      'nodeTypes': {}
    };

    nodeTypes.forEach((nodeType) => {
      const nodes = allNodes.filter((node) =>
        NodeAddress.hasPrefix(node, nodeType.prefix)
      )
      //console.log(indent + `${nodeType.pluralName}:`)
      //console.log(indent + indent + `total nodes: ${nodes.length}`)

      const totalNodeTypeCred = nodes.reduce((sum, node) => {
        return sum + pnd.get(node).score
      }, 0)

      graphDetail.adapters[adapterType].nodeTypes[nodeType.pluralName] = {
        'pluralName': nodeType.pluralName,
        'totalNodes': nodes.length,
        'totalCred': totalNodeTypeCred,
        'avgCred': nodes.length/totalNodeTypeCred
      }

      totalAdapterCred += totalNodeTypeCred
      totalAdapterNodes += nodes.length

      //console.log(indent + indent + `total cred: ${totalNodeTypeCred.toFixed(2)}`)
    })

    graphDetail.adapters[adapterType]['totalNodes'] = totalAdapterNodes;
    graphDetail.adapters[adapterType]['totalCred'] = totalAdapterCred;
    graphDetail.adapters[adapterType]['avgCred'] = totalAdapterNodes/totalAdapterCred;
    totalProjectCred += totalAdapterCred

  })

  graphDetail.totalNodes = allNodes.length
  graphDetail.totalCred = totalProjectCred.toFixed(2)
  graphDetail.averageCred = (totalProjectCred/allNodes.length).toFixed(2)

  printGraphDetail(graphDetail)
}


function printGraphDetail(graphDetail) {

  console.log(graphDetail)
  console.log(`Total nodes in project: ${graphDetail.totalNodes}`)
  console.log(`Total project cred:  ${graphDetail.totalCred}`)
  console.log(`Average cred:  ${graphDetail.averageCred}`)

  const adapterKeys = Object.keys(graphDetail.adapters).sort()

  adapterKeys.forEach((adapterKey) => {
    const adapter = graphDetail.adapters[adapterKey];
    console.log(adapterKey)
    console.log(indent(1) + "total nodes: " + adapter.totalNodes)
    console.log(indent(1) + "total cred: " + adapter.totalCred)
    console.log(indent(1) + "avgerage cred: " + adapter.avgCred)

    const nodeTypeKeys = Object.keys(adapter.nodeTypes).sort()

    nodeTypeKeys.forEach((nodeTypeKey) => {
      const nodeType = adapter.nodeTypes[nodeTypeKey]
      console.log(indent(2) + nodeType.pluralName)
      console.log(indent(3) + "total nodes: " + nodeType.totalNodes)
      console.log(indent(3) + "total cred: " + nodeType.totalCred)
      console.log(indent(3) + "avgerage cred: " + nodeType.avgCred)
    })
  })
}

function indent(n) {
  var spaces = ""
  for (var i = 1; i <= n; i++) {
    spaces += "   "
  }
  return spaces
}
