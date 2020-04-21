CodeMirror.defineSimpleMode("simplemode", {
  // The start state contains the rules that are intially used
  start: [
    {regex: /\ǂ[a-zA-Z0-9]{1}/,
     token: "keyword"}
	 //{regex: /(\ǂ[a-zA-Z0-9]{1} [\s]{0,1})([a-z$][\w$]*)/,
	//token: ["keyword", "url"]}
  ],
  // The meta property contains global information about the mode. It
  // can contain properties like lineComment, which are supported by
  // all modes, and also directives like dontIndentStates, which are
  // specific to simple modes.
  meta: {
    dontIndentStates: ["comment"],
    lineComment: "//"
  }
});